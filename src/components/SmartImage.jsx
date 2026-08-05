import React, { useState } from 'react';

// Resilient image: fades in on load, shows a shimmer skeleton until ready,
// and swaps to a fallback (usually the generative gradient) on error.
export function SmartImage({ src, fallback, alt = '', className = '', imgClass = '', eager = false, rounded = '' }) {
  const [loaded, setLoaded] = useState(false);
  const [current, setCurrent] = useState(src);

  return (
    <div className={`relative overflow-hidden bg-elevated ${rounded} ${className}`}>
      {!loaded && <div className="skeleton absolute inset-0" />}
      <img
        src={current}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding="async"
        onLoad={() => setLoaded(true)}
        onError={() => {
          if (fallback && current !== fallback) {
            setCurrent(fallback);
          } else {
            setLoaded(true);
          }
        }}
        className={`h-full w-full object-cover transition-all duration-700 ease-premium ${
          loaded ? 'scale-100 opacity-100 blur-0' : 'scale-105 opacity-0 blur-md'
        } ${imgClass}`}
      />
    </div>
  );
}
