// Natural-language search: turn a query like
//   "used Toyota SUV under K500,000 in Lusaka"
// into { category, values, summary } that drives the existing filter framework.
//
// Deterministic and testable — this is the seam where a hosted LLM would plug in.

import {
  VEHICLE_MAKES, VEHICLE_MAKE_NAMES, VEHICLE_TYPES, FUEL_TYPES, BODY_TYPES,
  ELECTRONICS_BRANDS, ELECTRONICS_TYPES,
} from '../data/filterSchema.js';
import { TOWN_NAMES, PROVINCES } from '../data/locations.js';
import { detectCategory } from './ai.js';

const has = (t, w) => new RegExp(`\\b${w.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`).test(t);

// "500k" → 500000, "1.5m" → 1500000, "500,000" → 500000
function amount(raw) {
  if (!raw) return null;
  let s = raw.toLowerCase().replace(/[, ]/g, '').replace(/kwacha|zmw|k(?=\d)/g, '');
  let mult = 1;
  if (/m$/.test(s)) { mult = 1_000_000; s = s.slice(0, -1); }
  else if (/k$/.test(s)) { mult = 1000; s = s.slice(0, -1); }
  const n = parseFloat(s);
  return Number.isFinite(n) ? Math.round(n * mult) : null;
}

const NUM = '(?:k?\\s?[\\d.,]+\\s?[km]?)';

function parsePrice(t) {
  let m;
  if ((m = t.match(new RegExp(`between\\s+(${NUM})\\s+and\\s+(${NUM})`)))) return { min: amount(m[1]), max: amount(m[2]) };
  if ((m = t.match(new RegExp(`(${NUM})\\s*(?:-|to|–)\\s*(${NUM})`)))) return { min: amount(m[1]), max: amount(m[2]) };
  if ((m = t.match(new RegExp(`(?:under|below|less than|up to|max|cheaper than)\\s+(${NUM})`)))) return { max: amount(m[1]) };
  if ((m = t.match(new RegExp(`(?:over|above|from|at least|min|more than)\\s+(${NUM})`)))) return { min: amount(m[1]) };
  return null;
}

function parseYear(t) {
  let m;
  if ((m = t.match(/\b(?:from|after|since)\s+(19|20)\d{2}\b/))) return { min: Number(m[0].match(/\d{4}/)[0]) };
  const y = t.match(/\b(19|20)\d{2}\b/);
  if (y) return { min: Number(y[0]), max: Number(y[0]) };
  return null;
}

function findTownName(t) {
  // longest match wins ("dar" shouldn't beat a real town); check multi-word first
  const sorted = [...TOWN_NAMES].sort((a, b) => b.length - a.length);
  return sorted.find((name) => has(t, name)) || null;
}
function findProvince(t) {
  return PROVINCES.map((p) => p.name).find((n) => has(t, n.replace('-', ' ')) || has(t, n)) || null;
}

export function parseQuery(text = '') {
  const t = ` ${text.toLowerCase()} `;
  const values = {};
  const parts = [];

  // ---- condition ----
  let cond = null;
  if (/\b(brand new|new)\b/.test(t)) cond = 'New';
  else if (/\bused|second[- ]?hand|pre[- ]?owned\b/.test(t)) cond = 'Used';
  else if (/\brefurb(ished)?\b/.test(t)) cond = 'Refurbished';

  // ---- vehicle signals ----
  const make = VEHICLE_MAKE_NAMES.find((mk) => has(t, mk));
  const vType = VEHICLE_TYPES.find((v) => v !== 'Other' && has(t, v));
  const fuel = FUEL_TYPES.find((f) => f !== 'Other' && has(t, f));
  const body = BODY_TYPES.find((b) => b !== 'Other' && has(t, b));

  // ---- electronics signals (with common product → brand/type shortcuts) ----
  let eBrand = ELECTRONICS_BRANDS.find((b) => b !== 'Other' && has(t, b));
  let eType = ELECTRONICS_TYPES.find((e) => has(t, e.toLowerCase().split(' ')[0]));
  if (/\biphone|ipad|macbook|imac\b/.test(t)) { eBrand = eBrand || 'Apple'; }
  if (/\biphone\b/.test(t)) eType = eType || 'Phones';
  if (/\bmacbook|laptop\b/.test(t)) eType = eType || 'Computers';
  if (/\bplaystation|ps5|xbox\b/.test(t)) { eBrand = eBrand || (/xbox/.test(t) ? 'Microsoft' : 'Sony'); eType = eType || 'Gaming'; }

  // ---- decide category ----
  let category = null;
  if (make || vType || fuel || (body && !eBrand)) category = 'vehicles';
  else if (eBrand || /\b(phone|iphone|laptop|macbook|tv|console|playstation|xbox|camera)\b/.test(t)) category = 'electronics';
  else category = detectCategory(text)?.category || null;

  // ---- location ----
  const town = findTownName(t);
  const province = !town && findProvince(t);
  if (/\bnear me\b/.test(t)) { values.location = { nearMe: true }; parts.push('near you'); }
  else if (town) { values.location = { town }; parts.push(town); }
  else if (province) { values.location = { province }; parts.push(province); }

  // ---- price ----
  const price = parsePrice(t);
  if (price && (price.min != null || price.max != null)) {
    values.price = { min: price.min ?? null, max: price.max ?? null };
    if (price.max && price.min) parts.push(`K${fmt(price.min)}–K${fmt(price.max)}`);
    else if (price.max) parts.push(`under K${fmt(price.max)}`);
    else parts.push(`from K${fmt(price.min)}`);
  }

  // ---- apply category-specific values ----
  if (category === 'vehicles') {
    if (make) {
      values.make = [make];
      parts.unshift(make);
      const model = (VEHICLE_MAKES[make] || []).find((md) => has(t, md));
      if (model) { values.model = [model]; parts.splice(1, 0, model); }
    }
    if (vType) { values.vehicleType = [vType]; parts.push(vType); }
    if (fuel) { values.fuel = [fuel]; parts.unshift(fuel); }
    if (body && !vType) { values.bodyType = [body]; parts.push(body); }
    if (cond) { values.condition = [cond]; parts.unshift(cond); }
    const yr = parseYear(t);
    if (yr) { values.year = { min: yr.min ?? null, max: yr.max ?? null }; parts.push(String(yr.min)); }
  } else if (category === 'electronics') {
    if (eBrand) { values.brand = [eBrand]; parts.unshift(eBrand); }
    if (eType) { values.type = [eType]; parts.push(eType); }
    if (cond) { values.condition = [cond]; parts.unshift(cond); }
  } else if (category === 'property') {
    const bed = t.match(/\b(\d+)\s*(?:bed(?:room)?s?|br)\b/);
    if (bed) { values.bedrooms = { min: Number(bed[1]), max: null }; parts.unshift(`${bed[1]}+ beds`); }
    if (/\bfor rent|to rent|rental\b/.test(t)) { values.listingKind = ['For Rent']; parts.push('For Rent'); }
    else if (/\bfor sale|buy\b/.test(t)) { values.listingKind = ['For Sale']; parts.push('For Sale'); }
  } else if (cond) {
    // generic condition mapping (best-effort)
    const map = { New: 'New', Used: 'Good', Refurbished: 'Like new' };
    values.condition = [map[cond]];
    parts.unshift(cond);
  }

  const summary = parts.filter(Boolean).join(' · ');
  const hasResult = category || Object.keys(values).length > 0;
  return { category, values, summary, matched: hasResult };
}

function fmt(n) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n % 1_000_000 ? 1 : 0)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}k`;
  return String(n);
}

// Apply a parsed query: navigate to the category and set its filters.
// `catKey` mirrors Search's convention ('all' when no category).
export function runNaturalSearch(text, dispatch, navigate) {
  const res = parseQuery(text);
  const catKey = res.category || 'all';
  if (Object.keys(res.values).length) {
    dispatch({ type: 'SET_CATEGORY_FILTERS', category: catKey, values: res.values });
  }
  dispatch({ type: 'PATCH_SEARCH', patch: { q: '' } });
  navigate(res.category ? `/category/${res.category}` : `/search?q=${encodeURIComponent(text)}`);
  return res;
}
