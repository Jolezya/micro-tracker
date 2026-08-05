import React from 'react';

// Kaira "K" monogram — matches the app icon. Uses a solid fill (no url(#id)
// gradient reference) so it renders reliably inside buttons/links everywhere.
export function Logo({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 512 512" aria-hidden>
      <rect width="512" height="512" rx="128" fill="#0d5b47" />
      <rect width="512" height="512" rx="128" fill="#0f6c54" fillOpacity="0.6" />
      <path
        d="M188 128 v256 M188 256 L320 128 M188 256 L332 384"
        fill="none"
        stroke="#f4f5f7"
        strokeWidth="34"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="360" cy="150" r="15" fill="#ceaa64" />
    </svg>
  );
}
