import { distanceKm, kwachaCompact } from './format.js';

// Pure, testable search + filter + sort over listings.

export const SORTS = [
  { value: 'relevant', label: 'Most relevant' },
  { value: 'newest', label: 'Newest first' },
  { value: 'price_low', label: 'Price: low to high' },
  { value: 'price_high', label: 'Price: high to low' },
  { value: 'distance', label: 'Closest first' },
  { value: 'popular', label: 'Most popular' },
];

export const DEFAULT_FILTERS = {
  q: '',
  category: null,
  sub: null,
  min: null,
  max: null,
  conditions: [],
  maxDistance: null, // km
  negotiableOnly: false,
};

export function matchesText(listing, q) {
  if (!q) return true;
  const hay = [
    listing.title,
    listing.description,
    listing.brand,
    listing.category,
    listing.subcategory,
    listing.location?.city,
    listing.location?.area,
    ...(listing.tags || []),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean)
    .every((term) => hay.includes(term));
}

export function filterListings(listings, filters = {}, origin = null) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  return listings.filter((l) => {
    if (!matchesText(l, f.q)) return false;
    if (f.category && l.category !== f.category) return false;
    if (f.sub && l.subcategory !== f.sub) return false;
    if (f.min != null && l.price < f.min) return false;
    if (f.max != null && l.price > f.max) return false;
    if (f.conditions?.length && !f.conditions.includes(l.condition)) return false;
    if (f.negotiableOnly && !l.negotiable) return false;
    if (f.maxDistance != null && origin) {
      const d = distanceKm(origin, l.location);
      if (d == null || d > f.maxDistance) return false;
    }
    return true;
  });
}

export function sortListings(listings, sort, origin = null, q = '') {
  const arr = [...listings];
  switch (sort) {
    case 'newest':
      return arr.sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt));
    case 'price_low':
      return arr.sort((a, b) => a.price - b.price);
    case 'price_high':
      return arr.sort((a, b) => b.price - a.price);
    case 'popular':
      return arr.sort((a, b) => b.views - a.views);
    case 'distance':
      if (!origin) return arr;
      return arr.sort(
        (a, b) => (distanceKm(origin, a.location) ?? 1e9) - (distanceKm(origin, b.location) ?? 1e9)
      );
    case 'relevant':
    default:
      // relevance: premium/sponsored boost, then text-match strength, then recency
      return arr.sort((a, b) => relevance(b, q) - relevance(a, q));
  }
}

function relevance(l, q) {
  let s = 0;
  if (l.sponsored) s += 40;
  if (l.premium) s += 25;
  s += Math.log10((l.views || 0) + 1) * 6;
  if (q) {
    const t = q.toLowerCase();
    if (l.title?.toLowerCase().includes(t)) s += 50;
    if (l.brand?.toLowerCase().includes(t)) s += 20;
  }
  // recency (days)
  const days = (Date.now() - Date.parse(l.postedAt)) / 86400000;
  s += Math.max(0, 20 - days);
  return s;
}

export function countActiveFilters(filters = {}) {
  const f = { ...DEFAULT_FILTERS, ...filters };
  let n = 0;
  if (f.category) n++;
  if (f.sub) n++;
  if (f.min != null || f.max != null) n++;
  if (f.conditions?.length) n++;
  if (f.maxDistance != null) n++;
  if (f.negotiableOnly) n++;
  return n;
}

// ============================================================
// Schema-driven, category-aware filtering engine.
// Values shape (per filter key):
//   chips/select : string[]                       (selected options)
//   price/range  : { min:number|null, max:number|null }
//   toggle       : boolean
//   location     : { province, town, nearMe, radius }
// ============================================================

const NEAR_ME_RADIUS = 25; // km

// Read a filter's field from a listing (top-level, then attrs).
export function getField(listing, field) {
  if (!listing) return undefined;
  if (field in listing) return listing[field];
  if (listing.attrs && field in listing.attrs) return listing.attrs[field];
  return undefined;
}

export function isFilterActive(def, value) {
  if (value == null) return false;
  switch (def.type) {
    case 'chips':
    case 'select':
      return Array.isArray(value) && value.length > 0;
    case 'price':
    case 'range':
      return value.min != null || value.max != null;
    case 'toggle':
      return value === true;
    case 'location':
      return !!(value.province || value.town || value.nearMe);
    default:
      return false;
  }
}

export function matchFilter(listing, def, value, origin = null) {
  if (!isFilterActive(def, value)) return true;
  const field = def.field || def.key;

  switch (def.type) {
    case 'chips':
    case 'select': {
      const lv = getField(listing, field);
      if (Array.isArray(lv)) return value.some((v) => lv.includes(v));
      return lv != null && value.includes(lv);
    }
    case 'price':
    case 'range': {
      const n = Number(getField(listing, field));
      if (Number.isNaN(n)) return false;
      if (value.min != null && n < value.min) return false;
      if (value.max != null && n > value.max) return false;
      return true;
    }
    case 'toggle':
      return !!getField(listing, field);
    case 'location': {
      const loc = listing.location;
      if (!loc) return false;
      if (value.province && loc.province !== value.province) return false;
      if (value.town && loc.city !== value.town) return false;
      if (value.nearMe && origin) {
        const d = distanceKm(origin, loc);
        if (d == null || d > (value.radius || NEAR_ME_RADIUS)) return false;
      }
      return true;
    }
    default:
      return true;
  }
}

// Filter a list against a schema's values. `skipKey` lets the UI compute the
// available result count for one facet while ignoring that facet's own value.
export function filterBySchema(listings, schema, values = {}, origin = null, skipKey = null) {
  if (!schema) return listings;
  return listings.filter((l) =>
    schema.filters.every((def) => (def.key === skipKey ? true : matchFilter(l, def, values[def.key], origin)))
  );
}

export function countBySchema(listings, schema, values, origin) {
  return filterBySchema(listings, schema, values, origin).length;
}

export function countActiveSchema(schema, values = {}) {
  if (!schema) return 0;
  return schema.filters.reduce((n, def) => n + (isFilterActive(def, values[def.key]) ? 1 : 0), 0);
}

// A short human label for an active filter value (for the removable chip row).
export function formatFilterValue(def, value) {
  switch (def.type) {
    case 'chips':
    case 'select':
      return value.length <= 2 ? value.join(', ') : `${value[0]} +${value.length - 1}`;
    case 'price':
    case 'range': {
      const u = def.unit === 'K' ? '' : def.unit || '';
      const fmt = def.unit === 'K' ? (n) => kwachaCompact(n) : (n) => `${n}${u}`;
      if (value.min != null && value.max != null) return `${fmt(value.min)}–${fmt(value.max)}`;
      if (value.min != null) return `From ${fmt(value.min)}`;
      return `Up to ${fmt(value.max)}`;
    }
    case 'toggle':
      return def.label;
    case 'location': {
      const parts = [];
      if (value.town) parts.push(value.town);
      else if (value.province) parts.push(value.province);
      if (value.nearMe) parts.push('Near me');
      return parts.join(' · ') || 'Location';
    }
    default:
      return '';
  }
}

// List of active filters as {def, value, text} for the chip row.
export function activeFilterList(schema, values = {}) {
  if (!schema) return [];
  return schema.filters
    .filter((def) => isFilterActive(def, values[def.key]))
    .map((def) => ({ def, value: values[def.key], text: formatFilterValue(def, values[def.key]) }));
}
