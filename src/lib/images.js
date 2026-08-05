// Kaira generative image system.
//
// The network policy in this environment blocks external image CDNs, and the
// app is offline-first (installable PWA), so listing photos are generated as
// deterministic, premium mesh-gradient SVG art — tinted per category, unique
// per (listing, photo index). It always looks intentional and never breaks.
//
// To use real photography instead, give a listing a `photos: [url, ...]` array;
// <SmartImage> will try those first and fall back to this generator on error.

// ---- deterministic PRNG (mulberry32) seeded from a string ----
function hashStr(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function mulberry32(a) {
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function hexToHsl(hex) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let hue = 0;
  const l = (max + min) / 2;
  const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) {
    if (max === r) hue = ((g - b) / d) % 6;
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue *= 60;
    if (hue < 0) hue += 360;
  }
  return [hue, Math.round(s * 100), Math.round(l * 100)];
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * Build a mesh-gradient SVG data URI.
 * @param {string} seed   deterministic seed (e.g. `${listingId}-${index}`)
 * @param {string} tint   category hex color to bias the palette
 * @param {number} w,h    dimensions
 */
export function gradientArt(seed, tint = '#0f6c54', w = 1200, h = 900) {
  const rnd = mulberry32(hashStr(seed));
  const [baseHue] = hexToHsl(tint);
  const dark = rnd() > 0.5;

  // Palette: a few hues clustered around the category hue.
  const hues = [
    baseHue,
    (baseHue + 18 + rnd() * 26) % 360,
    (baseHue - 22 - rnd() * 24 + 360) % 360,
    (baseHue + 40 + rnd() * 40) % 360,
  ];
  const bgL = dark ? 12 + rnd() * 8 : 88 + rnd() * 6;
  const bgHue = hues[0];
  const bg1 = `hsl(${bgHue} ${dark ? 42 : 46}% ${bgL}%)`;
  const bg2 = `hsl(${(bgHue + 30) % 360} ${dark ? 38 : 40}% ${clamp(bgL + (dark ? 8 : -8), 6, 96)}%)`;

  // 3–4 soft blobs
  const nBlobs = 3 + Math.floor(rnd() * 2);
  let blobs = '';
  for (let i = 0; i < nBlobs; i++) {
    const cx = Math.round(rnd() * w);
    const cy = Math.round(rnd() * h);
    const r = Math.round((0.32 + rnd() * 0.4) * w);
    const hue = hues[i % hues.length];
    const sat = dark ? 60 + rnd() * 20 : 62 + rnd() * 22;
    const li = dark ? 34 + rnd() * 20 : 58 + rnd() * 22;
    const op = 0.55 + rnd() * 0.3;
    blobs += `<circle cx="${cx}" cy="${cy}" r="${r}" fill="hsl(${hue.toFixed(
      0
    )} ${sat.toFixed(0)}% ${li.toFixed(0)}%)" opacity="${op.toFixed(2)}"/>`;
  }

  const vignette = dark ? 0.42 : 0.14;
  const grainOpacity = dark ? 0.35 : 0.28;

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<defs>
<linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
<stop offset="0" stop-color="${bg1}"/><stop offset="1" stop-color="${bg2}"/>
</linearGradient>
<radialGradient id="vig" cx="0.5" cy="0.42" r="0.75">
<stop offset="0.55" stop-color="#000" stop-opacity="0"/>
<stop offset="1" stop-color="#000" stop-opacity="${vignette}"/>
</radialGradient>
<filter id="soft" x="-30%" y="-30%" width="160%" height="160%">
<feGaussianBlur stdDeviation="90"/>
</filter>
<filter id="grain">
<feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch"/>
<feColorMatrix type="saturate" values="0"/>
<feComponentTransfer><feFuncA type="linear" slope="${grainOpacity}"/></feComponentTransfer>
<feComposite operator="in" in2="SourceGraphic"/>
</filter>
</defs>
<rect width="${w}" height="${h}" fill="url(#bg)"/>
<g filter="url(#soft)">${blobs}</g>
<rect width="${w}" height="${h}" fill="url(#vig)"/>
<rect width="${w}" height="${h}" filter="url(#grain)" opacity="0.5"/>
</svg>`;

  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

/**
 * Photos for a listing. Returns real URLs if present, otherwise generated art.
 */
export function listingPhotos(listing, tint = '#0f6c54') {
  if (listing?.photos?.length) return listing.photos;
  const count = listing?.photoCount ?? 4;
  return Array.from({ length: count }, (_, i) =>
    gradientArt(`${listing.id}-${i}`, tint)
  );
}

export function listingCover(listing, tint = '#0f6c54') {
  if (listing?.photos?.length) return listing.photos[0];
  return gradientArt(`${listing.id}-0`, tint);
}
