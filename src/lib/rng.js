// =============================================================================
//  Deterministic pseudo-random number generation
// -----------------------------------------------------------------------------
//  Every stochastic part of the platform (data jitter, Monte Carlo draws) uses a
//  SEEDED generator so that outputs are exactly reproducible. Reproducibility is
//  a hard requirement of the methodology: given the same inputs and seed, the
//  forecast and simulation must return the same numbers.
// =============================================================================

/** mulberry32 — fast, seedable 32-bit PRNG. Returns a function -> [0,1). */
export function mulberry32(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Deterministic 32-bit hash of a string — used to seed per-entity generators. */
export function hashString(str) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Standard-normal sample via Box–Muller, driven by a [0,1) generator. */
export function randNormal(rand, mean = 0, sd = 1) {
  let u = 0;
  let v = 0;
  while (u === 0) u = rand();
  while (v === 0) v = rand();
  const z = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return mean + sd * z;
}

/** Clamp helper. */
export const clamp = (x, lo, hi) => Math.max(lo, Math.min(hi, x));
