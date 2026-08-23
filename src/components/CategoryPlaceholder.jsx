import React from 'react';
import { ProductGlyph } from './ProductGlyph.jsx';
import { resolveKind, hash } from '../lib/media.js';

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

// A tasteful, brand-tinted "studio" placeholder used when a listing has no real
// photo. Category-specific glyph on a soft single-hue background — never a
// random gradient. Deterministic subtle variation per listing.
export function CategoryPlaceholder({ listing, showLabel = false, glyphSize = 44, minimal = false, className = '' }) {
  const { glyph, tint, label } = resolveKind(listing);
  const [r, g, b] = hexToRgb(tint);
  const seed = hash(listing?.id || 'x');
  const angle = 120 + (seed % 50);

  return (
    <div
      className={`relative flex h-full w-full items-center justify-center overflow-hidden ${className}`}
      style={{
        background: `linear-gradient(${angle}deg, rgba(${r},${g},${b},0.06), rgba(${r},${g},${b},0.13))`,
      }}
    >
      {/* soft studio tile behind the glyph */}
      <div
        className="grid aspect-square w-[46%] max-w-[150px] place-items-center rounded-[22%] bg-surface shadow-soft"
        style={{ boxShadow: `0 10px 30px -12px rgba(${r},${g},${b},0.45)` }}
      >
        <ProductGlyph name={glyph} size={glyphSize} strokeWidth={1.6} style={{ color: `rgb(${r},${g},${b})` }} />
      </div>

      {showLabel && !minimal && (
        <span className="absolute bottom-2 left-2.5 text-xs font-bold text-white/95 drop-shadow">{label}</span>
      )}
      {!minimal && (
        <span
          className="absolute bottom-2 right-2.5 text-[11px] font-extrabold tracking-tight"
          style={{ color: `rgba(${r},${g},${b},0.6)` }}
        >
          kaira
        </span>
      )}
    </div>
  );
}
