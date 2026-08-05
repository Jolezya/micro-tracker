// Formatting helpers — currency, relative time, distance, numbers.

export function formatPrice(listing) {
  if (!listing) return '';
  if (listing.priceLabel) return listing.priceLabel;
  if (listing.price === 0) return 'Free';
  const suffix = listing.priceSuffix ?? '';
  return `${kr(listing.price)}${suffix}`;
}

export function kr(amount) {
  if (amount == null) return '';
  return `${new Intl.NumberFormat('nb-NO').format(Math.round(amount))} kr`;
}

export function compactNumber(n) {
  if (n == null) return '0';
  if (n < 1000) return String(n);
  if (n < 1_000_000) return `${(n / 1000).toFixed(n < 10000 ? 1 : 0)}k`;
  return `${(n / 1_000_000).toFixed(1)}M`;
}

const MIN = 60 * 1000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

// `now` is injectable so tests are deterministic.
export function timeAgo(iso, now = Date.now()) {
  const t = typeof iso === 'number' ? iso : Date.parse(iso);
  const diff = Math.max(0, now - t);
  if (diff < MIN) return 'just now';
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m} min ago`;
  }
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${h === 1 ? 'hour' : 'hours'} ago`;
  }
  const d = Math.floor(diff / DAY);
  if (d < 7) return `${d} ${d === 1 ? 'day' : 'days'} ago`;
  if (d < 30) {
    const w = Math.floor(d / 7);
    return `${w} ${w === 1 ? 'week' : 'weeks'} ago`;
  }
  const mo = Math.floor(d / 30);
  if (mo < 12) return `${mo} ${mo === 1 ? 'month' : 'months'} ago`;
  const y = Math.floor(d / 365);
  return `${y} ${y === 1 ? 'year' : 'years'} ago`;
}

export function memberSince(ym) {
  // ym like "2019-03"
  const [y, m] = String(ym).split('-').map(Number);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];
  return `${months[(m || 1) - 1]} ${y}`;
}

// Haversine distance in km between two {lat,lng}
export function distanceKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
function toRad(d) {
  return (d * Math.PI) / 180;
}

export function formatDistance(km) {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m away`;
  if (km < 10) return `${km.toFixed(1)} km away`;
  return `${Math.round(km)} km away`;
}

export function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}
