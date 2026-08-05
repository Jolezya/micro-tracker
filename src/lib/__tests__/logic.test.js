import { describe, it, expect } from 'vitest';
import { filterListings, sortListings, countActiveFilters, DEFAULT_FILTERS } from '../search.js';
import { detectCategory, suggestPrice, suggestTitle, generateDescription, isDuplicate, fraudScore, recommend } from '../ai.js';
import { kr, timeAgo, distanceKm, formatDistance, compactNumber, initials, formatPrice } from '../format.js';
import { gradientArt } from '../images.js';

const NOW = Date.parse('2026-08-05T09:00:00Z');
const L = (over = {}) => ({
  id: 'l1', title: 'Item', category: 'electronics', subcategory: 'Phones', price: 1000,
  condition: 'Good', brand: null, negotiable: false, views: 10,
  postedAt: new Date(NOW - 3600 * 1000).toISOString(),
  location: { city: 'Oslo', lat: 59.91, lng: 10.75 }, tags: [], ...over,
});

describe('format', () => {
  it('formats NOK', () => {
    expect(kr(1234567)).toMatch(/1\D?234\D?567 kr/);
    expect(kr(0)).toBe('0 kr');
  });
  it('formatPrice handles free, labels and suffixes', () => {
    expect(formatPrice({ price: 0 })).toBe('Free');
    expect(formatPrice({ priceLabel: 'Competitive' })).toBe('Competitive');
    expect(formatPrice({ price: 890, priceSuffix: '/hr' })).toMatch(/890 kr\/hr/);
  });
  it('timeAgo is relative and deterministic', () => {
    expect(timeAgo(NOW - 30 * 1000, NOW)).toBe('just now');
    expect(timeAgo(NOW - 5 * 60000, NOW)).toBe('5 min ago');
    expect(timeAgo(NOW - 2 * 3600000, NOW)).toBe('2 hours ago');
    expect(timeAgo(NOW - 3 * 86400000, NOW)).toBe('3 days ago');
  });
  it('compactNumber', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(1500)).toBe('1.5k');
    expect(compactNumber(2_400_000)).toBe('2.4M');
  });
  it('initials', () => {
    expect(initials('Astrid Bakken')).toBe('AB');
    expect(initials('Kaira')).toBe('K');
  });
  it('distance between Oslo and Bergen is ~300km', () => {
    const d = distanceKm({ lat: 59.9139, lng: 10.7522 }, { lat: 60.3913, lng: 5.3221 });
    expect(d).toBeGreaterThan(250);
    expect(d).toBeLessThan(340);
    expect(formatDistance(0.4)).toMatch(/m away/);
  });
});

describe('search: filter + sort', () => {
  const data = [
    L({ id: 'a', title: 'iPhone 15 Pro', price: 12000, category: 'electronics', views: 100, postedAt: new Date(NOW - 1000).toISOString() }),
    L({ id: 'b', title: 'Tesla Model Y', price: 419000, category: 'vehicles', views: 500, condition: 'Like new' }),
    L({ id: 'c', title: 'Wooden chair', price: 800, category: 'furniture', views: 5, negotiable: true }),
  ];
  it('text search matches title and tags', () => {
    expect(filterListings(data, { q: 'tesla' }).map((l) => l.id)).toEqual(['b']);
    expect(filterListings(data, { q: 'nonexistent' })).toHaveLength(0);
  });
  it('filters by category, price range, condition, negotiable', () => {
    expect(filterListings(data, { category: 'furniture' }).map((l) => l.id)).toEqual(['c']);
    expect(filterListings(data, { min: 10000, max: 100000 }).map((l) => l.id)).toEqual(['a']);
    expect(filterListings(data, { conditions: ['Like new'] }).map((l) => l.id)).toEqual(['b']);
    expect(filterListings(data, { negotiableOnly: true }).map((l) => l.id)).toEqual(['c']);
  });
  it('filters by distance from origin', () => {
    const origin = { lat: 59.9139, lng: 10.7522 };
    const far = [L({ id: 'far', location: { city: 'Tromsø', lat: 69.64, lng: 18.95 } })];
    expect(filterListings(far, { maxDistance: 50 }, origin)).toHaveLength(0);
    expect(filterListings(far, { maxDistance: 5000 }, origin)).toHaveLength(1);
  });
  it('sorts by price ascending/descending and newest', () => {
    expect(sortListings(data, 'price_low').map((l) => l.id)).toEqual(['c', 'a', 'b']);
    expect(sortListings(data, 'price_high').map((l) => l.id)).toEqual(['b', 'a', 'c']);
    expect(sortListings(data, 'newest')[0].id).toBe('a');
  });
  it('relevance boosts sponsored/premium', () => {
    const boosted = sortListings(
      [L({ id: 'x', views: 1 }), L({ id: 'y', views: 1, sponsored: true })],
      'relevant'
    );
    expect(boosted[0].id).toBe('y');
  });
  it('counts active filters', () => {
    expect(countActiveFilters(DEFAULT_FILTERS)).toBe(0);
    expect(countActiveFilters({ category: 'vehicles', min: 100, conditions: ['New'] })).toBe(3);
  });
});

describe('ai heuristics', () => {
  it('detects category from text', () => {
    expect(detectCategory('iPhone 15 Pro Max').category).toBe('electronics');
    expect(detectCategory('Tesla Model Y electric car').category).toBe('vehicles');
    expect(detectCategory('Golden retriever puppy').category).toBe('pets');
    expect(detectCategory('zzz nothing')).toBeNull();
  });
  it('suggests a price with condition + brand multipliers', () => {
    const comps = [L({ price: 10000 }), L({ price: 14000 }), L({ price: 12000 })];
    const p = suggestPrice({ category: 'electronics', condition: 'Like new', comps });
    expect(p.mid).toBeGreaterThan(0);
    expect(p.low).toBeLessThan(p.mid);
    expect(p.high).toBeGreaterThan(p.mid);
    const worse = suggestPrice({ category: 'electronics', condition: 'Fair', comps });
    expect(worse.mid).toBeLessThan(p.mid);
  });
  it('generates a title and description', () => {
    expect(suggestTitle({ brand: 'apple', model: 'iPhone 15', condition: 'New' })).toMatch(/Apple iPhone 15/);
    const d = generateDescription({ title: 'iPhone', category: 'electronics', condition: 'Like new', brand: 'Apple' });
    expect(d.length).toBeGreaterThan(40);
    expect(d).toMatch(/Apple/);
  });
  it('detects near-duplicate listings', () => {
    const existing = [L({ id: 'orig', title: 'iPhone 15 Pro Max 256GB', price: 12000 })];
    expect(isDuplicate({ title: 'iPhone 15 Pro Max 256GB', category: 'electronics', price: 12500 }, existing)).toBe(true);
    expect(isDuplicate({ title: 'Completely different sofa', category: 'furniture', price: 12000 }, existing)).toBe(false);
  });
  it('flags suspicious listings', () => {
    const comps = [L({ price: 100000 }), L({ price: 120000 })];
    const scam = fraudScore(L({ price: 5000, description: 'wire transfer only, send gift card' }), comps);
    expect(scam.flags.length).toBeGreaterThan(0);
    expect(scam.risk).not.toBe('low');
    const clean = fraudScore(L({ price: 110000, description: 'A well maintained item in great condition, honest sale.' }), comps);
    expect(clean.risk).toBe('low');
  });
  it('recommends similar listings first', () => {
    const target = L({ id: 't', category: 'vehicles', brand: 'BMW', price: 500000 });
    const pool = [
      L({ id: 'same', category: 'vehicles', brand: 'BMW', price: 520000 }),
      L({ id: 'other', category: 'furniture', price: 900 }),
    ];
    expect(recommend(target, [target, ...pool])[0].id).toBe('same');
  });
});

describe('images', () => {
  it('generates a deterministic svg data uri', () => {
    const a = gradientArt('seed-1', '#0f6c54');
    const b = gradientArt('seed-1', '#0f6c54');
    const c = gradientArt('seed-2', '#0f6c54');
    expect(a).toMatch(/^data:image\/svg\+xml,/);
    expect(a).toBe(b); // deterministic
    expect(a).not.toBe(c); // varies by seed
  });
});
