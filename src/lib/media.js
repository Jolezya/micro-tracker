// ============================================================
// Kaira media layer — how every listing gets its imagery.
//
// Priority order (seller photos always win):
//   1. listing.photos[]     — seller-uploaded images (data URIs or URLs)
//   2. listing.imageUrls[]  — real category photography (production seam)
//   3. CATEGORY_STOCK[kind] — bundled/remote stock photos, if configured
//   4. Branded, category-specific placeholder (generated, self-contained)
//
// The placeholder is a tasteful, brand-tinted "studio" tile with the product's
// icon — NOT a random gradient — so the app looks polished offline and in the
// preview, while real photography slots in for a live deployment.
// ============================================================

import { CATEGORY_MAP } from '../data/categories.js';
import { GLYPHS } from './glyphs.js';
import { STOCK } from './stock.js';

// Map a listing to a fine-grained product "kind": which glyph + label to show.
export function resolveKind(listing) {
  if (!listing) return { glyph: 'sparkles', label: 'Item', tint: '#0f6c54' };
  const cat = CATEGORY_MAP[listing.category];
  const tint = cat?.color || '#0f6c54';
  const sub = (listing.subcategory || '').toLowerCase();
  const a = listing.attrs || {};
  let glyph = cat?.icon ? ICON_FALLBACK[listing.category] || 'sparkles' : 'sparkles';
  let label = listing.subcategory || cat?.label || 'Item';

  switch (listing.category) {
    case 'vehicles': {
      const vt = (a.vehicleType || '').toLowerCase();
      if (vt === 'pickup' || sub.includes('pickup')) glyph = 'truck';
      else if (vt === 'van' || vt === 'truck') glyph = 'truck';
      else if (vt === 'bus') glyph = 'bus';
      else if (vt === 'motorcycle') glyph = 'bike';
      else glyph = 'car';
      label = a.fuel === 'Electric' ? 'Electric' : listing.subcategory || 'Vehicle';
      break;
    }
    case 'motorcycles':
      glyph = 'bike';
      break;
    case 'property': {
      if (/plot|land/.test(sub)) { glyph = 'trees'; label = 'Land / Plot'; }
      else if ((a.propertyType || '').match(/apartment|flat/i) || sub.includes('rent')) glyph = 'building2';
      else if ((a.propertyType || '').match(/commercial|office/i) || sub.includes('commercial')) glyph = 'building2';
      else glyph = 'home';
      break;
    }
    case 'electronics': {
      if (sub.includes('phone')) glyph = 'smartphone';
      else if (sub.includes('computer')) glyph = 'laptop';
      else if (sub.includes('tv') || sub.includes('audio')) glyph = 'tv';
      else if (sub.includes('gaming')) glyph = 'gamepad2';
      else if (sub.includes('camera')) glyph = 'camera';
      else glyph = 'smartphone';
      break;
    }
    case 'furniture':
      glyph = 'armchair';
      break;
    case 'fashion': {
      if (sub.includes('shoe')) glyph = 'footprints';
      else if (sub.includes('bag')) glyph = 'shoppingbag';
      else if (sub.includes('watch')) glyph = 'watch';
      else glyph = 'shirt';
      break;
    }
    case 'sports': {
      if (sub.includes('water')) glyph = 'sailboat';
      else if (sub.includes('fitness')) glyph = 'dumbbell';
      else glyph = 'bike';
      break;
    }
    case 'collectibles':
      glyph = sub.includes('watch') ? 'watch' : 'gem';
      break;
    case 'pets': {
      if (sub.includes('dog')) glyph = 'dog';
      else if (sub.includes('cat')) glyph = 'cat';
      else if (sub.includes('bird')) glyph = 'bird';
      else glyph = 'pawprint';
      break;
    }
    case 'boats':
      glyph = 'sailboat';
      break;
    case 'jobs':
      glyph = 'briefcase';
      break;
    case 'services':
      glyph = sub.includes('moving') ? 'truck' : sub.includes('clean') ? 'sparkles' : 'wrench';
      break;
    case 'business':
      glyph = 'store';
      break;
    default:
      glyph = 'sparkles';
  }
  if (!GLYPHS[glyph]) glyph = 'sparkles';
  return { glyph, label, tint };
}

const ICON_FALLBACK = {
  vehicles: 'car', property: 'home', electronics: 'smartphone', furniture: 'armchair',
  fashion: 'shirt', sports: 'bike', collectibles: 'gem', pets: 'pawprint', boats: 'sailboat',
  motorcycles: 'bike', jobs: 'briefcase', services: 'wrench', business: 'store', everything: 'sparkles',
};

// Bundled stock library (kind -> [urls]), auto-discovered from src/assets/stock.
// Empty by default → branded placeholders. Drop images in to enable photography.
export const CATEGORY_STOCK = STOCK;

// Seller-first list of REAL photo URLs for a listing (may be empty).
export function realPhotos(listing) {
  if (listing?.photos?.length) return listing.photos;
  if (listing?.imageUrls?.length) return listing.imageUrls;
  const { glyph } = resolveKind(listing);
  const stock = CATEGORY_STOCK[glyph];
  if (stock?.length) {
    const i = hash(listing.id) % stock.length;
    return [stock[i], ...stock.slice(0, i), ...stock.slice(i + 1)];
  }
  return [];
}

export function hasRealPhoto(listing) {
  return realPhotos(listing).length > 0;
}

// Cover: a real photo URL if available, else null (caller renders placeholder).
export function coverPhoto(listing) {
  return realPhotos(listing)[0] || null;
}

// ---- deterministic hash for per-listing variation ----
export function hash(str = '') {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0);
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// A branded, category-specific placeholder as an SVG data URI (for <img> src:
// galleries, seller-upload previews). Restrained duotone + product glyph.
export function placeholderDataUri(listing, opts = {}) {
  const { glyph, tint } = resolveKind(listing);
  const seed = hash((listing?.id || 'x') + (opts.index || 0));
  const [r, g, b] = hexToRgb(tint);
  const dark = opts.dark;
  const w = opts.w || 1200;
  const h = opts.h || 900;
  // soft duotone background (single hue, low intensity)
  const bg1 = dark ? `rgb(${(r * 0.35) | 0},${(g * 0.35) | 0},${(b * 0.35) | 0})` : `rgba(${r},${g},${b},0.10)`;
  const bg2 = dark ? `rgb(${(r * 0.22) | 0},${(g * 0.22) | 0},${(b * 0.22) | 0})` : `rgba(${r},${g},${b},0.20)`;
  const surface = dark ? '#16181c' : '#ffffff';
  const angle = 120 + (seed % 40);
  const glyphInner = GLYPHS[glyph] || GLYPHS.sparkles;
  const tileR = 210;
  const cx = w / 2, cy = h / 2;
  const gScale = 5.6; // 24px viewBox -> ~134px
  const gSize = 24 * gScale;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs><linearGradient id="bg" gradientTransform="rotate(${angle})"><stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/></linearGradient></defs>
<rect width="${w}" height="${h}" fill="${surface}"/>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<ellipse cx="${cx}" cy="${cy + tileR * 0.86}" rx="${tileR * 0.95}" ry="34" fill="rgba(0,0,0,0.06)"/>
<rect x="${cx - tileR}" y="${cy - tileR}" width="${tileR * 2}" height="${tileR * 2}" rx="56" fill="${surface}" stroke="rgba(${r},${g},${b},0.18)" stroke-width="2"/>
<g transform="translate(${cx - gSize / 2}, ${cy - gSize / 2}) scale(${gScale})" fill="none" stroke="rgb(${r},${g},${b})" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${glyphInner}</g>
<text x="${w - 26}" y="${h - 24}" text-anchor="end" font-family="-apple-system,Segoe UI,Roboto,sans-serif" font-size="26" font-weight="700" fill="rgba(${r},${g},${b},0.55)">kaira</text>
</svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

// Photos for the detail gallery: seller/real photos, else N placeholder slides.
export function galleryImages(listing) {
  const real = realPhotos(listing);
  if (real.length) return real;
  const n = Math.min(listing?.photoCount || 3, 4);
  return Array.from({ length: n }, (_, i) => placeholderDataUri(listing, { index: i }));
}

// Badge hierarchy (max 2, no clutter):
//   1 primary placement/plan signal  +  optional Verified trust signal
//   priority: Boosted → Sponsored → Gold → Premium
export function badgesFor(listing, seller) {
  const out = [];
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const plan = listing.listingPlan;
  const isGold = plan === 'gold' || (!plan && listing.premium && listing.sponsored);
  const isPremium = plan === 'premium' || (!plan && listing.premium);

  if (boosted) out.push({ label: 'Boosted', kind: 'boosted' });
  else if (listing.sponsored) out.push({ label: 'Sponsored', kind: 'sponsored' });
  else if (isGold) out.push({ label: 'Gold', kind: 'gold' });
  else if (isPremium) out.push({ label: 'Premium', kind: 'premium' });

  if (seller?.verified?.includes('id')) out.push({ label: 'Verified', kind: 'verified' });
  return out.slice(0, 2);
}

export const BADGE_STYLE = {
  sponsored: 'glass text-ink',
  premium: 'text-white',
  gold: 'text-white',
  new: 'text-accent-ink',
  verified: 'text-white',
  featured: 'text-white',
  boosted: 'text-white',
};
export const BADGE_BG = {
  premium: 'rgb(var(--accent))',
  gold: '#b08d4a',
  new: 'rgb(var(--accent))',
  verified: '#2563eb',
  featured: '#7c3aed',
  boosted: '#ea580c',
};
