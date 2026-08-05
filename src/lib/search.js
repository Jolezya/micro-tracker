import { distanceKm } from './format.js';

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

function matchesText(listing, q) {
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
