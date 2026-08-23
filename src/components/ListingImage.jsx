import React from 'react';
import { SmartImage } from './SmartImage.jsx';
import { CategoryPlaceholder } from './CategoryPlaceholder.jsx';
import { coverPhoto, placeholderDataUri } from '../lib/media.js';

// The single entry point for a listing's cover image.
// Seller/real photos win; otherwise a branded category placeholder is rendered.
export function ListingImage({ listing, className = '', rounded = '', eager = false, glyphSize = 44, showLabel = false, minimal = false }) {
  const photo = coverPhoto(listing);
  if (photo) {
    return (
      <SmartImage
        src={photo}
        fallback={placeholderDataUri(listing)}
        alt={listing.title}
        className={className}
        rounded={rounded}
        eager={eager}
      />
    );
  }
  return (
    <div className={`overflow-hidden ${rounded} ${className}`}>
      <CategoryPlaceholder listing={listing} glyphSize={glyphSize} showLabel={showLabel} minimal={minimal} />
    </div>
  );
}
