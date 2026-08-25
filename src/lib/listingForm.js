// ============================================================
// Inverse of the Sell screen's buildListing(): turn a stored listing back
// into the dynamic form state so it can be edited.
//
// buildListing() flattens the form into a listing (schema fields → brand /
// condition / subcategory / attrs). Editing needs the round trip, and it has
// to stay schema-driven: which field owns `brand` or `subcategory` differs per
// category, so both directions read the same schema rather than hardcoding
// key names.
// ============================================================

import { listingSchema } from '../data/listingSchema.js';

// Rebuild the category-field values (`fv`) from a listing.
export function fvFromListing(schema, listing) {
  const fv = {};
  const attrs = listing?.attrs || {};
  for (const f of schema.fields) {
    let raw;
    if (f.top === 'brand') raw = listing?.brand;
    else if (f.top === 'condition') raw = listing?.condition;
    else if (f.top === 'subcategory') raw = listing?.subcategory;
    else raw = attrs[f.attr || f.key];

    if (raw == null || raw === '' || (Array.isArray(raw) && !raw.length)) continue;

    // Mirror the shapes the editors expect: chips hold an array, numbers are
    // edited as strings, toggles are booleans, selects/text are strings.
    if (f.type === 'chips') fv[f.key] = Array.isArray(raw) ? raw : [raw];
    else if (f.type === 'number') fv[f.key] = String(raw);
    else if (f.type === 'toggle') fv[f.key] = !!raw;
    else fv[f.key] = String(Array.isArray(raw) ? raw[0] : raw);
  }
  return fv;
}

// Full form state for editing an existing listing.
export function formFromListing(listing, fallbackLocation = '') {
  const schema = listingSchema(listing?.category);
  const attrs = listing?.attrs || {};
  // Jobs store the figure as attrs.salary with price zeroed, so the price
  // field would otherwise come back empty when editing a job.
  const priceSource = listing?.category === 'jobs' && attrs.salary ? attrs.salary : listing?.price;

  return {
    category: listing?.category ?? null,
    listingPlan: listing?.listingPlan || 'mahala',
    photos: (listing?.photos || []).map((src, i) => ({ id: `p_edit_${i}_${Math.random().toString(36).slice(2, 6)}`, src, real: true })),
    title: listing?.title || '',
    description: listing?.description || '',
    fv: fvFromListing(schema, listing),
    price: priceSource ? String(priceSource) : '',
    negotiable: !!listing?.negotiable,
    // Only the explicit "Price on request" choice round-trips; category-derived
    // labels like "Quote on request" come back from the pricing-model field.
    onRequest: listing?.priceLabel === 'Price on request',
    location: listing?.location?.city || fallbackLocation,
    phone: listing?.contactPhone || '',
    delivery: listing?.delivery?.length ? listing.delivery : ['Pickup'],
  };
}
