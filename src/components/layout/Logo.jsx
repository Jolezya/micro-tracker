import React from 'react';

// ============================================================
// The Kaira mark — a K cut in two.
//
// The rising arm is gold (the listing that gets seen), the stem and falling
// arm hold in off-white. One geometry, drawn at 512 and scaled: stroke 48,
// round caps, arms meeting the stem at its midpoint. The glyph sits inside a
// 185px radius of centre, which keeps it clear of an Android maskable crop.
//
// Solid fills only — no url(#id) gradient references, which break when the
// same mark is rendered more than once on a page or inside a <button>.
// ============================================================

const TILE = '#0d5b47';
const STEM = '#f6f5f1';
const ARM = '#d9b872';

// The mark itself, on whatever ground the caller provides.
export function KairaMark({ size = 32, stem = STEM, arm = ARM, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      <path d="M170 132 V380" stroke={stem} strokeWidth="48" strokeLinecap="round" fill="none" />
      <path d="M194 254 L342 372" stroke={stem} strokeWidth="48" strokeLinecap="round" fill="none" />
      <path d="M194 258 L338 140" stroke={arm} strokeWidth="48" strokeLinecap="round" fill="none" />
    </svg>
  );
}

// The app icon: the mark on the brand tile. This is what the header, sign-up
// screen and empty states use.
export function Logo({ size = 32, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" className={className} aria-hidden>
      <rect width="512" height="512" rx="128" fill={TILE} />
      <path d="M170 132 V380" stroke={STEM} strokeWidth="48" strokeLinecap="round" fill="none" />
      <path d="M194 254 L342 372" stroke={STEM} strokeWidth="48" strokeLinecap="round" fill="none" />
      <path d="M194 258 L338 140" stroke={ARM} strokeWidth="48" strokeLinecap="round" fill="none" />
    </svg>
  );
}
