// Kaira "AI" — transparent, on-device heuristics that power the smart features.
// These are deterministic and fully testable (no network, no keys). In a
// production build these functions are the seam where a real ML service or LLM
// would be plugged in behind the same signatures.

import { CATEGORIES } from '../data/categories.js';

const CATEGORY_KEYWORDS = {
  vehicles: ['car', 'tesla', 'bmw', 'audi', 'toyota', 'volvo', 'electric car', 'suv', 'sedan', 'diesel', 'petrol', 'mileage', 'model y', 'rs6'],
  motorcycles: ['motorcycle', 'motorbike', 'ktm', 'yamaha', 'harley', 'ducati', 'scooter', 'enduro', 'moped'],
  property: ['apartment', 'villa', 'house', 'cabin', 'flat', 'office', 'rent', 'plot', 'home', 'studio', 'm²', 'bedroom'],
  electronics: ['iphone', 'macbook', 'laptop', 'phone', 'tv', 'playstation', 'ps5', 'xbox', 'camera', 'samsung', 'ipad', 'monitor', 'headphones', 'console'],
  furniture: ['sofa', 'table', 'chair', 'desk', 'shelf', 'wardrobe', 'bed', 'lamp', 'dining', 'couch', 'bookcase', 'stool'],
  fashion: ['jacket', 'dress', 'shoes', 'sneakers', 'bag', 'watch', 'rolex', 'gucci', 'nike', 'louis vuitton', 'coat', 'handbag', 'boots'],
  sports: ['bike', 'bicycle', 'kayak', 'ski', 'dumbbell', 'treadmill', 'golf', 'tennis', 'snowboard', 'skateboard', 'paddle', 'gym'],
  collectibles: ['pokemon', 'card', 'coin', 'stamp', 'vinyl', 'comic', 'antique', 'art', 'collectible', 'psa', 'figure'],
  pets: ['dog', 'cat', 'puppy', 'kitten', 'horse', 'rabbit', 'aquarium', 'pet', 'terrarium'],
  boats: ['boat', 'yacht', 'sailboat', 'kayak', 'jet ski', 'dinghy', 'rib', 'outboard', 'axopar'],
  jobs: ['job', 'hiring', 'vacancy', 'position', 'role', 'developer', 'designer', 'engineer', 'manager', 'part-time', 'full-time'],
  services: ['service', 'cleaning', 'moving', 'plumber', 'electrician', 'tutor', 'repair', 'painting', 'gardening', 'photographer'],
  business: ['equipment', 'inventory', 'wholesale', 'machinery', 'retail', 'pallet', 'commercial', 'b2b'],
};

const CONDITION_MULTIPLIER = {
  New: 1.15,
  'Like new': 1.0,
  Good: 0.82,
  Fair: 0.62,
  'For parts': 0.35,
};

const PREMIUM_BRANDS = ['rolex', 'omega', 'louis vuitton', 'gucci', 'audi', 'bmw', 'tesla', 'apple', 'fogia'];

// ---------- Category detection ----------
export function detectCategory(text = '') {
  const t = text.toLowerCase();
  let best = null;
  let bestScore = 0;
  for (const [cat, words] of Object.entries(CATEGORY_KEYWORDS)) {
    let score = 0;
    for (const w of words) {
      if (t.includes(w)) score += w.length > 5 ? 2 : 1;
    }
    if (score > bestScore) {
      bestScore = score;
      best = cat;
    }
  }
  if (!best) return null;
  const confidence = Math.min(0.98, 0.5 + bestScore * 0.12);
  return { category: best, confidence };
}

// ---------- Title generation ----------
export function suggestTitle({ brand, model, category, condition } = {}) {
  const parts = [];
  if (brand) parts.push(cap(brand));
  if (model) parts.push(model);
  if (!brand && !model && category) {
    const c = CATEGORIES.find((x) => x.id === category);
    parts.push(c ? c.label : 'Item');
  }
  let title = parts.join(' ').trim();
  if (condition === 'New') title += ' — brand new';
  else if (condition === 'Like new') title += ' — like new';
  return title || 'Untitled listing';
}

// ---------- Description generation ----------
export function generateDescription({ title, category, condition, brand, features = [], location } = {}) {
  const cat = CATEGORIES.find((c) => c.id === category);
  const catWord = cat ? cat.label.toLowerCase() : 'item';
  const cond = (condition || 'good').toLowerCase();
  const opener = brand
    ? `${cap(brand)} ${title ? title.replace(new RegExp(brand, 'i'), '').trim() : catWord} in ${cond} condition.`
    : `${cap(title || catWord)} in ${cond} condition.`;
  const feat = features.filter(Boolean).length
    ? ` Highlights: ${features.filter(Boolean).join(', ')}.`
    : '';
  const trust =
    condition === 'New' || condition === 'Like new'
      ? ' Barely used and cared for — honest photos, no surprises.'
      : ' Well looked after with normal signs of use, priced to sell.';
  const close = location
    ? ` Pickup in ${location}, or we can agree on delivery. Message me with any questions.`
    : ' Message me with any questions — happy to send more photos.';
  return (opener + feat + trust + close).replace(/\s+/g, ' ').trim();
}

// ---------- Price suggestion ----------
// comps: array of listings in the same category with numeric prices.
export function suggestPrice({ category, condition, brand, comps = [] } = {}) {
  const sameCat = comps.filter((c) => c.category === category && c.price > 0);
  let base;
  if (sameCat.length >= 2) {
    base = median(sameCat.map((c) => c.price));
  } else if (sameCat.length === 1) {
    base = sameCat[0].price;
  } else {
    base = DEFAULT_BASE[category] ?? 1500;
  }
  const condMult = CONDITION_MULTIPLIER[condition] ?? 0.82;
  const brandMult = brand && PREMIUM_BRANDS.includes(brand.toLowerCase()) ? 1.12 : 1;
  const mid = Math.round((base * condMult * brandMult) / 10) * 10;
  return {
    low: roundNice(mid * 0.88),
    mid: roundNice(mid),
    high: roundNice(mid * 1.14),
    basis: sameCat.length,
  };
}

// Fallback base prices in Zambian Kwacha (used when there are no comparables).
const DEFAULT_BASE = {
  vehicles: 1200000,
  property: 12000000,
  electronics: 25000,
  furniture: 9000,
  fashion: 8000,
  sports: 20000,
  collectibles: 90000,
  pets: 6000,
  boats: 1500000,
  motorcycles: 250000,
  jobs: 0,
  services: 500,
  business: 60000,
  everything: 1500,
};

// ---------- Duplicate detection ----------
export function isDuplicate(candidate, existing) {
  const a = tokenize(candidate.title);
  return existing.some((e) => {
    if (e.category !== candidate.category) return false;
    const b = tokenize(e.title);
    const sim = jaccard(a, b);
    const priceClose =
      candidate.price && e.price
        ? Math.abs(candidate.price - e.price) / Math.max(candidate.price, e.price) < 0.1
        : false;
    return sim > 0.6 && priceClose;
  });
}

// ---------- Fraud / trust scoring ----------
export function fraudScore(listing, comps = []) {
  const flags = [];
  const sameCat = comps.filter((c) => c.category === listing.category && c.price > 0);
  const typical = sameCat.length ? median(sameCat.map((c) => c.price)) : null;

  if (typical && listing.price > 0 && listing.price < typical * 0.35) {
    flags.push('Price far below similar listings');
  }
  const text = `${listing.title} ${listing.description || ''}`.toLowerCase();
  const scamWords = ['western union', 'wire transfer only', 'gift card', 'shipping agent', 'advance payment', 'prince', 'inheritance'];
  for (const w of scamWords) if (text.includes(w)) flags.push(`Suspicious phrase: “${w}”`);
  if ((listing.description || '').length < 15) flags.push('Very short description');
  if (/(.)\1{4,}/.test(text)) flags.push('Repeated characters');

  const score = clamp(1 - flags.length * 0.28, 0, 1);
  return { score, flags, risk: score > 0.8 ? 'low' : score > 0.5 ? 'medium' : 'high' };
}

// ---------- Recommendations ----------
export function recommend(listing, all, limit = 6) {
  if (!listing) return [];
  return all
    .filter((l) => l.id !== listing.id)
    .map((l) => ({ l, s: similarity(listing, l) }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.l);
}

function similarity(a, b) {
  let s = 0;
  if (a.category === b.category) s += 3;
  if (a.subcategory && a.subcategory === b.subcategory) s += 1.5;
  if (a.brand && a.brand === b.brand) s += 2;
  if (a.price && b.price) {
    const ratio = Math.min(a.price, b.price) / Math.max(a.price, b.price);
    s += ratio * 2;
  }
  if (a.location?.city === b.location?.city) s += 0.5;
  return s;
}

// ---------- utils ----------
function cap(s) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}
function tokenize(s = '') {
  return new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 2)
  );
}
function jaccard(a, b) {
  if (!a.size || !b.size) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}
function median(arr) {
  const s = [...arr].sort((x, y) => x - y);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}
function roundNice(n) {
  if (n >= 100000) return Math.round(n / 1000) * 1000;
  if (n >= 10000) return Math.round(n / 500) * 500;
  if (n >= 1000) return Math.round(n / 50) * 50;
  return Math.round(n / 10) * 10;
}
function clamp(n, lo, hi) {
  return Math.max(lo, Math.min(hi, n));
}
