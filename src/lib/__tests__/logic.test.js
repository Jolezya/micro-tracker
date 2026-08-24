import { describe, it, expect } from 'vitest';
import {
  filterListings, sortListings, countActiveFilters, DEFAULT_FILTERS,
  filterBySchema, getField, isFilterActive, countActiveSchema, activeFilterList, matchFilter,
} from '../search.js';
import { LISTINGS } from '../../data/listings.js';
import { schemaFor } from '../../data/filterSchema.js';
import { planBenefits, boostReach, LISTING_PLANS, BOOST_OPTIONS } from '../../data/plans.js';
import { parseQuery } from '../nlSearch.js';
import { detectCategory, suggestPrice, suggestTitle, generateDescription, isDuplicate, fraudScore, recommend, closestOption } from '../ai.js';
import { kwacha, kwachaCompact, timeAgo, distanceKm, formatDistance, compactNumber, initials, formatPrice } from '../format.js';
import { placeholderDataUri, resolveKind, coverPhoto, realPhotos, badgesFor } from '../media.js';
import { TOWNS_FULL, TOWN_NAMES, findTown, townCoords, locationOf, PROVINCES } from '../../data/locations.js';
import { listingSchema, visibleFields, missingRequired, photoRule } from '../../data/listingSchema.js';

const NOW = Date.parse('2026-08-05T09:00:00Z');
const L = (over = {}) => ({
  id: 'l1', title: 'Item', category: 'electronics', subcategory: 'Phones', price: 1000,
  condition: 'Good', brand: null, negotiable: false, views: 10,
  postedAt: new Date(NOW - 3600 * 1000).toISOString(),
  location: { city: 'Oslo', lat: 59.91, lng: 10.75 }, tags: [], ...over,
});

describe('format', () => {
  it('formats Kwacha', () => {
    expect(kwacha(1234567)).toBe('K1,234,567');
    expect(kwacha(0)).toBe('K0');
  });
  it('formats compact Kwacha for tight spaces', () => {
    expect(kwachaCompact(1050000)).toBe('K1.1M');
    expect(kwachaCompact(28000)).toBe('K28k');
    expect(kwachaCompact(800)).toBe('K800');
    expect(kwachaCompact(0)).toBe('Free');
  });
  it('formatPrice handles free, labels and suffixes', () => {
    expect(formatPrice({ price: 0 })).toBe('Free');
    expect(formatPrice({ priceLabel: 'Competitive' })).toBe('Competitive');
    expect(formatPrice({ price: 890, priceSuffix: '/hr' })).toBe('K890/hr');
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

describe('locations (Zambia)', () => {
  it('covers all 10 provinces and a broad set of towns', () => {
    expect(PROVINCES).toHaveLength(10);
    expect(TOWN_NAMES.length).toBeGreaterThan(90);
    expect(TOWN_NAMES).toContain('Lusaka');
    expect(TOWN_NAMES).toContain('Kitwe');
    expect(TOWN_NAMES).toContain('Livingstone');
    expect(TOWN_NAMES).toContain('Solwezi');
    expect(TOWN_NAMES).toContain('Mongu');
    expect(TOWN_NAMES).toContain('Chinsali'); // Muchinga
  });
  it('every town resolves to coordinates inside Zambia', () => {
    for (const t of TOWNS_FULL) {
      expect(t.lat).toBeGreaterThan(-19);
      expect(t.lat).toBeLessThan(-8);
      expect(t.lng).toBeGreaterThan(21);
      expect(t.lng).toBeLessThan(34);
    }
  });
  it('findTown is case-insensitive and locationOf builds a listing location', () => {
    expect(findTown('lusaka').province).toBe('Lusaka');
    expect(findTown('nope')).toBeNull();
    const loc = locationOf('Kitwe', 'Riverside');
    expect(loc.city).toBe('Kitwe');
    expect(loc.area).toBe('Riverside');
    expect(loc.province).toBe('Copperbelt');
  });
  it('derives coordinates for towns without explicit coords', () => {
    const c = townCoords({ name: 'Nsama', province: 'Northern' });
    expect(typeof c.lat).toBe('number');
    expect(typeof c.lng).toBe('number');
  });
});

describe('category-aware filter framework', () => {
  const vehicles = LISTINGS.filter((l) => l.category === 'vehicles');
  const vSchema = schemaFor('vehicles');

  it('resolves a different schema per category (and land for plots)', () => {
    expect(schemaFor('vehicles').id).toBe('vehicles');
    expect(schemaFor('jobs').id).toBe('jobs');
    expect(schemaFor('property').id).toBe('property');
    expect(schemaFor('property', 'Plots').id).toBe('land');
    expect(schemaFor('fashion').id).toBe('default');
  });

  it('land schema has no "condition" filter but property does', () => {
    expect(schemaFor('property', 'Plots').filters.some((f) => f.key === 'condition')).toBe(false);
    expect(schemaFor('vehicles').filters.some((f) => f.key === 'condition')).toBe(true);
  });

  it('reads attrs-aware fields', () => {
    const tesla = LISTINGS.find((l) => l.id === 'l_tesla_y');
    expect(getField(tesla, 'fuel')).toBe('Electric');
    expect(getField(tesla, 'price')).toBe(1050000);
    expect(getField(tesla, 'vehicleType')).toBe('SUV');
  });

  it('combines filters intelligently (make + type + fuel + province + price)', () => {
    const values = {
      make: ['Tesla'],
      vehicleType: ['SUV'],
      fuel: ['Electric'],
      location: { province: 'Lusaka' },
      price: { min: 500000, max: 1500000 },
    };
    const res = filterBySchema(vehicles, vSchema, values, null);
    expect(res.map((l) => l.id)).toContain('l_tesla_y');
    // A conflicting brand yields nothing
    expect(filterBySchema(vehicles, vSchema, { ...values, make: ['BMW'] }, null)).toHaveLength(0);
  });

  it('model options depend on the selected make', () => {
    const modelDef = vSchema.filters.find((f) => f.key === 'model');
    expect(modelDef.optionsFrom({ make: [] })).toEqual([]);
    const bmwModels = modelDef.optionsFrom({ make: ['BMW'] });
    expect(bmwModels).toContain('3 Series');
    expect(bmwModels).not.toContain('Corolla');
  });

  it('range filters respect min/max and skip when empty', () => {
    const yearDef = vSchema.filters.find((f) => f.key === 'year');
    const tesla = LISTINGS.find((l) => l.id === 'l_tesla_y'); // 2023
    expect(matchFilter(tesla, yearDef, { min: 2022, max: 2024 })).toBe(true);
    expect(matchFilter(tesla, yearDef, { min: 2024, max: null })).toBe(false);
    expect(matchFilter(tesla, yearDef, { min: null, max: null })).toBe(true); // inactive
  });

  it('location filter matches province/town and near-me radius', () => {
    const locDef = vSchema.filters.find((f) => f.key === 'location');
    const tesla = LISTINGS.find((l) => l.id === 'l_tesla_y'); // Lusaka
    expect(matchFilter(tesla, locDef, { province: 'Lusaka' })).toBe(true);
    expect(matchFilter(tesla, locDef, { province: 'Copperbelt' })).toBe(false);
    expect(matchFilter(tesla, locDef, { nearMe: true, radius: 30 }, { lat: -15.4167, lng: 28.2833 })).toBe(true);
  });

  it('counts active filters and lists them for removal', () => {
    const values = { make: ['Toyota'], price: { min: 100000, max: null }, fuel: [] };
    expect(isFilterActive(vSchema.filters.find((f) => f.key === 'make'), values.make)).toBe(true);
    expect(isFilterActive(vSchema.filters.find((f) => f.key === 'fuel'), values.fuel)).toBe(false);
    expect(countActiveSchema(vSchema, values)).toBe(2);
    const list = activeFilterList(vSchema, values);
    expect(list.map((x) => x.def.key).sort()).toEqual(['make', 'price']);
  });
});

describe('custom values — "did you mean?"', () => {
  const makes = ['Toyota', 'BMW', 'Mercedes-Benz', 'Nissan', 'Volkswagen'];
  it('matches containment and typos to a standard option', () => {
    expect(closestOption('Mercedes', makes).match).toBe('Mercedes-Benz');
    expect(closestOption('toyta', makes).match).toBe('Toyota');
    expect(closestOption('bmw', makes)).toEqual({ match: 'BMW', exact: true });
  });
  it('returns null for a genuinely new value (e.g. BYD)', () => {
    expect(closestOption('BYD', makes)).toBeNull();
    expect(closestOption('', makes)).toBeNull();
  });
});

describe('natural-language search', () => {
  it('parses "used Toyota SUV under K500,000 in Lusaka"', () => {
    const r = parseQuery('Find me a used Toyota SUV under K500,000 in Lusaka');
    expect(r.category).toBe('vehicles');
    expect(r.values.make).toEqual(['Toyota']);
    expect(r.values.vehicleType).toEqual(['SUV']);
    expect(r.values.condition).toEqual(['Used']);
    expect(r.values.price).toEqual({ min: null, max: 500000 });
    expect(r.values.location).toEqual({ town: 'Lusaka' });
  });

  it('parses a price range and fuel', () => {
    const r = parseQuery('electric BMW between K1,000,000 and K2,000,000');
    expect(r.category).toBe('vehicles');
    expect(r.values.fuel).toEqual(['Electric']);
    expect(r.values.make).toEqual(['BMW']);
    expect(r.values.price).toEqual({ min: 1000000, max: 2000000 });
  });

  it('maps common electronics products to brand + type', () => {
    const r = parseQuery('refurbished iPhone under 20k');
    expect(r.category).toBe('electronics');
    expect(r.values.brand).toEqual(['Apple']);
    expect(r.values.type).toEqual(['Phones']);
    expect(r.values.condition).toEqual(['Refurbished']);
    expect(r.values.price).toEqual({ min: null, max: 20000 });
  });

  it('parses property bedrooms + town + near-me', () => {
    const r = parseQuery('3 bedroom house for rent in Kitwe');
    expect(r.category).toBe('property');
    expect(r.values.bedrooms).toEqual({ min: 3, max: null });
    expect(r.values.listingKind).toEqual(['For Rent']);
    expect(r.values.location).toEqual({ town: 'Kitwe' });
    expect(parseQuery('sofa near me').values.location).toEqual({ nearMe: true });
  });
});

describe('selling plans & monetisation', () => {
  const texts = (planId, cat) => planBenefits(planId, cat).items.map((i) => i.text);

  it('has exactly three individual selling plans, Premium recommended', () => {
    expect(LISTING_PLANS.map((p) => p.id)).toEqual(['mahala', 'premium', 'gold']);
    expect(LISTING_PLANS.find((p) => p.id === 'premium').recommended).toBe(true);
    expect(LISTING_PLANS.find((p) => p.id === 'mahala').price).toBe(0);
  });

  it('benefits are category-aware', () => {
    expect(texts('premium', 'vehicles')).toContain('Featured vehicle');
    expect(texts('premium', 'vehicles')).toContain('Dealer promotion');
    expect(texts('premium', 'property')).toContain('Featured property');
    expect(texts('premium', 'jobs')).toContain('Highlighted job');
    expect(texts('premium', 'jobs')).toContain('Employer branding');
    expect(texts('gold', 'jobs')).toContain('Top of job search results');
    // branding is hidden where irrelevant (electronics)
    expect(texts('premium', 'electronics')).not.toContain('Dealer promotion');
  });

  it('plans inherit from the tier below', () => {
    expect(planBenefits('premium').inherits).toBe('Mahala');
    expect(planBenefits('gold').inherits).toBe('Premium');
    expect(planBenefits('mahala').inherits).toBeNull();
  });

  it('boost reach scales with plan', () => {
    expect(boostReach('gold')).toMatch(/homepage/i);
    expect(boostReach('mahala')).not.toMatch(/homepage/i);
    expect(BOOST_OPTIONS.map((b) => b.days)).toEqual([1, 3, 7]);
  });

  it('an active boost floats a listing to the top of relevance', () => {
    const base = L({ id: 'plain', views: 5 });
    const boosted = L({ id: 'boom', views: 1, boostedUntil: Date.now() + 3600000 });
    expect(sortListings([base, boosted], 'relevant')[0].id).toBe('boom');
  });
});

describe('media layer', () => {
  const tesla = LISTINGS.find((l) => l.id === 'l_tesla_y');
  const phone = LISTINGS.find((l) => l.id === 'l_iphone');
  const dog = LISTINGS.find((l) => l.id === 'l_dog');
  const plot = LISTINGS.find((l) => l.id === 'l_plot_lusaka');

  it('resolves category-specific product glyphs', () => {
    expect(resolveKind(tesla).glyph).toBe('car');
    expect(resolveKind(phone).glyph).toBe('smartphone');
    expect(resolveKind(dog).glyph).toBe('dog');
    expect(resolveKind(plot).glyph).toBe('trees');
  });

  it('prioritises seller photos over placeholders', () => {
    const withPhoto = { ...phone, photos: ['https://example.com/a.jpg'] };
    expect(coverPhoto(withPhoto)).toBe('https://example.com/a.jpg');
    expect(realPhotos(phone)).toEqual([]); // no seller/real photos → placeholder path
    expect(coverPhoto(phone)).toBeNull();
  });

  it('caps listing badges at one placement/plan badge plus Verified', () => {
    const verified = { verified: ['id'] };
    const plain = { verified: [] };
    // placement beats plan, plan beats nothing — only ever one of them
    const sponsored = badgesFor({ sponsored: true, premium: true, listingPlan: 'gold' }, verified);
    expect(sponsored.map((b) => b.label)).toEqual(['Sponsored', 'Verified']);
    expect(badgesFor({ listingPlan: 'gold' }, verified).map((b) => b.label)).toEqual(['Gold', 'Verified']);
    expect(badgesFor({ listingPlan: 'premium' }, verified).map((b) => b.label)).toEqual(['Premium', 'Verified']);
    // an active boost outranks every other placement label
    expect(badgesFor({ boostedUntil: Date.now() + 6e4, sponsored: true }, verified)[0].label).toBe('Boosted');
    // never more than two, and unverified sellers get no trust badge
    expect(badgesFor({ sponsored: true, listingPlan: 'gold' }, verified).length).toBeLessThanOrEqual(2);
    expect(badgesFor({ listingPlan: 'premium' }, plain).map((b) => b.label)).toEqual(['Premium']);
    expect(badgesFor({}, plain)).toEqual([]);
  });

  it('generates a deterministic, category-tinted placeholder data uri', () => {
    const a = placeholderDataUri(tesla);
    const b = placeholderDataUri(tesla);
    const c = placeholderDataUri(phone);
    expect(a).toMatch(/^data:image\/svg\+xml,/);
    expect(a).toBe(b); // deterministic per listing
    expect(a).not.toBe(c); // varies by listing/kind
  });
});

// ============================================================
// Category-driven listing schema engine
// ============================================================
describe('listing schema engine', () => {
  it('returns a category-specific schema with tailored helper text', () => {
    expect(listingSchema('vehicles').titleExample).toMatch(/Toyota|Corolla/i);
    expect(listingSchema('electronics').titleExample).toMatch(/iPhone|GB/i);
    expect(listingSchema('property').titleExample).toMatch(/Bedroom|House/i);
    expect(listingSchema('jobs').isJob).toBe(true);
  });

  it('falls back to the default schema for unknown categories', () => {
    const d = listingSchema('does-not-exist');
    expect(d).toBe(listingSchema('everything'));
    expect(d.fields.some((f) => f.key === 'condition')).toBe(true);
  });

  it('progressively discloses the model field only after a make (dependent options)', () => {
    const schema = listingSchema('vehicles');
    const model = schema.fields.find((f) => f.key === 'model');
    expect(model.optionsFrom({})).toEqual([]); // no make yet
    const opts = model.optionsFrom({ make: 'Toyota' }); // select stores a string
    expect(opts.length).toBeGreaterThan(0);
    expect(opts).toContain('Corolla');
  });

  it('only asks for a vehicle variant once a model is known', () => {
    const schema = listingSchema('vehicles');
    const early = visibleFields(schema, { vehicleType: ['Car'], make: 'Toyota' }).map((f) => f.key);
    expect(early).not.toContain('variant');
    const later = visibleFields(schema, { vehicleType: ['Car'], make: 'Toyota', model: 'Corolla' }).map((f) => f.key);
    expect(later).toContain('variant');
  });

  it('asks service-specific questions including where the seller works', () => {
    const keys = visibleFields(listingSchema('services'), {}).map((f) => f.key);
    expect(keys).toEqual(expect.arrayContaining(['serviceCategory', 'pricingModel', 'availability', 'serviceArea', 'worksAt']));
    // and never vehicle/condition questions
    expect(keys).not.toContain('condition');
    expect(keys).not.toContain('mileage');
  });

  it('hides body type for motorcycles but shows it for cars', () => {
    const schema = listingSchema('vehicles');
    const car = visibleFields(schema, { vehicleType: ['Car'] });
    const moto = visibleFields(schema, { vehicleType: ['Motorcycle'] });
    expect(car.some((f) => f.key === 'bodyType')).toBe(true);
    expect(moto.some((f) => f.key === 'bodyType')).toBe(false);
  });

  it('swaps building fields for land fields when the property is a plot', () => {
    const schema = listingSchema('property');
    const house = visibleFields(schema, { propertyType: ['House'] }).map((f) => f.key);
    const land = visibleFields(schema, { propertyType: ['Land / Plot'] }).map((f) => f.key);
    expect(house).toContain('bedrooms');
    expect(house).not.toContain('landUse');
    expect(land).toContain('landUse');
    expect(land).not.toContain('bedrooms');
    // land never asks for "condition"
    expect(schema.fields.some((f) => f.key === 'condition')).toBe(false);
  });

  it('reveals electronics storage/ram/os only for the right product types', () => {
    const schema = listingSchema('electronics');
    const phone = visibleFields(schema, { type: ['Phones'] }).map((f) => f.key);
    const tv = visibleFields(schema, { type: ['TV & Audio'] }).map((f) => f.key);
    expect(phone).toEqual(expect.arrayContaining(['storage', 'ram', 'os']));
    expect(tv).not.toContain('storage');
    expect(tv).toContain('screenSize');
  });

  it('satisfies required fields routed to subcategory (regression: unpublishable categories)', () => {
    // electronics/fashion/pets/services route a REQUIRED field to `subcategory`.
    // If the caller passes subcategory: null those categories can never publish.
    for (const [cat, key, val] of [
      ['electronics', 'type', 'Phones'],
      ['fashion', 'type', 'Shoes'],
      ['pets', 'type', 'Dogs'],
      ['services', 'serviceCategory', 'Moving'],
    ]) {
      const schema = listingSchema(cat);
      const field = schema.fields.find((f) => f.key === key);
      expect(field.top).toBe('subcategory');
      expect(field.required).toBe(true);
      // unset → reported missing
      expect(missingRequired(schema, {}, { subcategory: null })).toContain(field.label);
      // set → satisfied once the caller derives subcategory from the field
      expect(missingRequired(schema, { [key]: [val] }, { subcategory: val })).not.toContain(field.label);
    }
  });

  it('reports missing required fields across top-level and attr keys', () => {
    const schema = listingSchema('vehicles');
    const missing = missingRequired(schema, {}, {});
    expect(missing).toEqual(expect.arrayContaining(['Vehicle type', 'Make / brand', 'Condition']));
    const done = missingRequired(
      schema,
      { vehicleType: ['Car'] },
      { brand: 'Toyota', condition: 'Good' }
    );
    expect(done).toEqual([]);
  });
});

// ============================================================
// Category-based photo requirements
// ============================================================
describe('photo requirement framework', () => {
  it('requires photos for appearance-driven categories', () => {
    for (const c of ['vehicles', 'motorcycles', 'boats', 'property', 'electronics', 'furniture', 'fashion', 'sports', 'collectibles', 'pets']) {
      expect(photoRule(listingSchema(c)).level).toBe('required');
    }
  });

  it('makes photos optional for jobs and services', () => {
    expect(photoRule(listingSchema('jobs')).level).toBe('optional');
    expect(photoRule(listingSchema('services')).level).toBe('optional');
    expect(photoRule(listingSchema('jobs')).min).toBe(0);
  });

  it('flips property from required to optional for land/plots (subcategory rule)', () => {
    const schema = listingSchema('property');
    expect(photoRule(schema, { propertyType: ['House'] }).level).toBe('required');
    const land = photoRule(schema, { propertyType: ['Land / Plot'] });
    expect(land.level).toBe('optional');
    expect(land.title).toMatch(/site|map|optional/i);
    // land guidance swaps building slots for site/map slots
    expect(land.slots).toEqual(expect.arrayContaining(['Survey plan', 'Map']));
  });

  it('marks subcategory-dependent rules as deferred so the photos step does not hard-block', () => {
    expect(photoRule(listingSchema('property')).deferred).toBe(true); // has an override
    expect(photoRule(listingSchema('vehicles')).deferred).toBe(false); // unambiguous
  });

  it('surfaces category-specific photo guidance and slots', () => {
    const v = photoRule(listingSchema('vehicles'));
    expect(v.title).toMatch(/vehicle/i);
    expect(v.slots).toEqual(expect.arrayContaining(['Front', 'Rear', 'Interior', 'Dashboard']));
    const e = photoRule(listingSchema('electronics'));
    expect(e.slots).toEqual(expect.arrayContaining(['Screen', 'Any visible damage']));
    // no cross-category leakage
    expect(v.slots).not.toContain('Screen');
  });

  it('defaults unknown/catch-all categories to recommended (encouraged, never blocked)', () => {
    expect(photoRule(listingSchema('everything')).level).toBe('recommended');
    expect(photoRule(listingSchema('does-not-exist')).level).toBe('recommended');
  });
});
