// Small formatting helpers used across the UI.

export const nf = new Intl.NumberFormat('en-US');
export const num = (x) => nf.format(Math.round(x || 0));
export const pct = (x, d = 1) => `${((x || 0) * 100).toFixed(d)}%`;
export const pts = (x, d = 1) => `${x >= 0 ? '+' : ''}${((x || 0) * 100).toFixed(d)}`;
export const signed = (x) => `${x >= 0 ? '+' : ''}${num(x)}`;

export function compact(x) {
  const n = Math.abs(x || 0);
  if (n >= 1e6) return `${(x / 1e6).toFixed(2)}M`;
  if (n >= 1e3) return `${(x / 1e3).toFixed(0)}k`;
  return num(x);
}

export function timeAgo(ts, now = Date.now()) {
  const s = Math.max(0, Math.floor((now - ts) / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ${m % 60}m ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function clockTime(ts) {
  const d = new Date(ts);
  return d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
}
