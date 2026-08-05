import React, { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Navigation } from 'lucide-react';
import { ListingRow } from './ListingCard.jsx';
import { formatPrice, kwachaCompact } from '../lib/format.js';

// A lightweight, offline stylised map. Pins are positioned by lat/lng within
// the data's bounding box — no external tile service required.
export function MapView({ listings }) {
  const [selected, setSelected] = useState(null);

  const withLoc = listings.filter((l) => l.location?.lat != null);
  const bounds = useMemo(() => {
    if (!withLoc.length) return null;
    const lats = withLoc.map((l) => l.location.lat);
    const lngs = withLoc.map((l) => l.location.lng);
    const pad = 0.6;
    return {
      minLat: Math.min(...lats) - pad,
      maxLat: Math.max(...lats) + pad,
      minLng: Math.min(...lngs) - pad,
      maxLng: Math.max(...lngs) + pad,
    };
  }, [withLoc]);

  const pos = (loc) => {
    if (!bounds) return { x: 50, y: 50 };
    const x = ((loc.lng - bounds.minLng) / (bounds.maxLng - bounds.minLng)) * 100;
    const y = (1 - (loc.lat - bounds.minLat) / (bounds.maxLat - bounds.minLat)) * 100;
    return { x, y };
  };

  const sel = withLoc.find((l) => l.id === selected);

  return (
    <div className="overflow-hidden rounded-3xl border border-hairline">
      <div className="relative h-[52vh] min-h-[360px] w-full bg-elevated">
        {/* stylised landmass + grid */}
        <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none">
          <defs>
            <pattern id="mapgrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M40 0H0V40" fill="none" stroke="rgb(var(--faint))" strokeOpacity="0.12" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#mapgrid)" />
          <path
            d="M20,70 C15,50 30,40 35,25 C40,12 55,8 60,20 C66,34 55,44 62,55 C70,68 55,80 45,82 C33,84 25,86 20,70 Z"
            fill="rgb(var(--accent))"
            fillOpacity="0.08"
            transform="scale(6)"
          />
        </svg>

        {/* your location */}
        <div className="absolute left-1/2 top-[62%] -translate-x-1/2" title="You">
          <span className="relative flex h-4 w-4">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-accent opacity-40" />
            <span className="relative inline-flex h-4 w-4 items-center justify-center rounded-full bg-accent text-white ring-2 ring-bg">
              <Navigation size={9} fill="currentColor" />
            </span>
          </span>
        </div>

        {/* pins */}
        {withLoc.map((l) => {
          const { x, y } = pos(l.location);
          const active = l.id === selected;
          return (
            <button
              key={l.id}
              onClick={() => setSelected(active ? null : l.id)}
              className="absolute -translate-x-1/2 -translate-y-full"
              style={{ left: `${x}%`, top: `${y}%`, zIndex: active ? 20 : 10 }}
            >
              <motion.span
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.94 }}
                className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-bold shadow-lift transition ${
                  active ? 'btn-accent' : 'bg-surface text-ink'
                }`}
              >
                <MapPin size={11} className={active ? '' : 'text-accent'} />
                {l.price > 0 ? kwachaCompact(l.price) : formatPrice(l)}
              </motion.span>
            </button>
          );
        })}
      </div>

      <AnimatePresence>
        {sel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="border-t border-hairline bg-surface p-2"
          >
            <ListingRow listing={sel} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
