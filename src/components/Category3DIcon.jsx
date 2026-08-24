import React from 'react';
import { CategoryIcon } from './CategoryIcon.jsx';

// Mix a hex colour toward white (amt > 0) or black (amt < 0). amt ∈ [-1, 1].
function shade(hex, amt) {
  const n = parseInt(hex.slice(1), 16);
  let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  if (amt >= 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; }
  else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
  return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
}

// Premium semi-3D category tile: one gradient chip with consistent top-left
// lighting — a soft top highlight, a lower bevel, a colour-tinted drop shadow,
// and a specular gloss — with the glyph lifted off the surface. Deliberately
// subtle (fintech / Apple), never cartoonish. One renderer drives every
// category so lighting, depth and weight stay identical across the grid.
export function Category3DIcon({ category, size = 56, glyphSize, className = '' }) {
  const color = category.color || '#64748b';
  const light = shade(color, 0.32);
  const base = color;
  const dark = shade(color, -0.24);
  const radius = Math.round(size * 0.3);

  return (
    <span
      className={`relative inline-grid shrink-0 place-items-center ${className}`}
      style={{
        width: size,
        height: size,
        borderRadius: radius,
        background: `linear-gradient(150deg, ${light} 0%, ${base} 54%, ${dark} 100%)`,
        boxShadow: `0 10px 20px -8px ${color}80, 0 4px 8px -5px ${color}73, inset 0 1.5px 0.5px rgba(255,255,255,0.55), inset 0 -3px 7px ${dark}`,
      }}
    >
      {/* specular gloss — top ~55%, fades out */}
      <span
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0"
        style={{
          height: '56%',
          borderTopLeftRadius: radius,
          borderTopRightRadius: radius,
          background: 'linear-gradient(180deg, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 45%, rgba(255,255,255,0) 100%)',
        }}
      />
      <CategoryIcon
        name={category.icon}
        size={glyphSize || Math.round(size * 0.46)}
        strokeWidth={2.1}
        className="relative text-white"
        style={{ filter: 'drop-shadow(0 1.5px 1.5px rgba(0,0,0,0.28))' }}
      />
    </span>
  );
}
