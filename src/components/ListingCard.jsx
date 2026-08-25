import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Heart, MapPin, Sparkles, Crown, BadgeCheck, Rocket } from 'lucide-react';
import { ListingImage } from './ListingImage.jsx';
import { Skeleton } from './ui/kit.jsx';
import { formatPrice, timeAgo } from '../lib/format.js';
import { badgesFor, BADGE_STYLE, BADGE_BG } from '../lib/media.js';
import { getUser } from '../data/users.js';
import { useStore } from '../lib/store.jsx';
import { useAuthGate } from '../lib/useAuthGate.jsx';

function SaveButton({ id, className = '' }) {
  const { state, dispatch } = useStore();
  const requireAuth = useAuthGate();
  const saved = state.saved.includes(id);
  return (
    <button
      aria-label={saved ? 'Remove from saved' : 'Save listing'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        requireAuth('save', () => dispatch({ type: 'TOGGLE_SAVE', id }));
      }}
      className={`press grid place-items-center rounded-full transition ${className}`}
    >
      <motion.span key={String(saved)} initial={{ scale: 0.6 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 600, damping: 18 }}>
        <Heart size={18} strokeWidth={2.2} className={saved ? 'text-danger' : 'text-white'} fill={saved ? 'currentColor' : 'none'} />
      </motion.span>
    </button>
  );
}

function BadgeChip({ badge }) {
  const Icon = badge.kind === 'gold' ? Crown : badge.kind === 'verified' ? BadgeCheck : badge.kind === 'sponsored' ? Sparkles : badge.kind === 'boosted' ? Rocket : null;
  const style = { background: BADGE_BG[badge.kind] };
  const cls = BADGE_STYLE[badge.kind] || 'text-white';
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${cls}`}
      style={badge.kind === 'sponsored' ? undefined : style}
    >
      {Icon && <Icon size={10} strokeWidth={2.6} />}
      {badge.label}
    </span>
  );
}

export function ListingCard({ listing, index = 0 }) {
  const seller = getUser(listing.sellerId);
  const badges = badgesFor(listing, seller);
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: Math.min(index * 0.03, 0.3) }}
    >
      <Link to={`/listing/${listing.id}`} className="group block">
        {/* IMAGE — prominent, but no longer dominating the whole card */}
        <div className="relative aspect-square overflow-hidden rounded-3xl bg-elevated">
          <ListingImage
            listing={listing}
            className="h-full w-full transition-transform duration-500 group-hover:scale-[1.04]"
            eager={index < 4}
            glyphSize={48}
          />
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-2">
            {/* placement/plan badge + trust badge — never more than two */}
            <div className="flex min-w-0 flex-col items-start gap-1">
              {badges.map((b) => <BadgeChip key={b.label} badge={b} />)}
            </div>
            <SaveButton id={listing.id} className="pointer-events-auto h-8 w-8 shrink-0 bg-black/25 backdrop-blur-md" />
          </div>
        </div>
        {/* PRICE → TITLE → LOCATION · TIME */}
        <div className="px-1 pt-2">
          <div className="flex items-baseline justify-between gap-2">
            <p className="truncate text-[15px] font-extrabold leading-tight text-ink">{formatPrice(listing)}</p>
            {listing.negotiable && <span className="shrink-0 text-[10px] font-medium text-faint">Negotiable</span>}
          </div>
          {/* two lines reserved so titles never truncate mid-word and every
              card in a row lines up */}
          <p className="mt-1 line-clamp-2 min-h-[2.75em] text-[13px] font-medium leading-snug text-ink">{listing.title}</p>
          <div className="mt-0.5 flex items-center gap-1 text-[11px] text-faint">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{listing.location?.area || listing.location?.city}</span>
            <span aria-hidden>·</span>
            <span className="shrink-0">{timeAgo(listing.postedAt)}</span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

export function ListingRow({ listing }) {
  const seller = getUser(listing.sellerId);
  const badges = badgesFor(listing, seller);
  return (
    <Link to={`/listing/${listing.id}`} className="press group flex gap-3 rounded-2xl p-2 transition hover:bg-elevated">
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-2xl">
        <ListingImage listing={listing} className="h-full w-full" glyphSize={30} minimal />
        {badges[0] && (
          <span className="absolute left-1 top-1">
            <BadgeChip badge={badges[0]} />
          </span>
        )}
      </div>
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-[15px] font-extrabold text-ink">{formatPrice(listing)}</p>
          <SaveButton id={listing.id} className="h-8 w-8 bg-ink/5" />
        </div>
        <p className="mt-0.5 line-clamp-2 text-sm text-muted">{listing.title}</p>
        <div className="mt-1.5 flex items-center gap-1 text-xs text-faint">
          <MapPin size={12} />
          <span className="truncate">{listing.location?.area || listing.location?.city}</span>
          <span aria-hidden>·</span>
          <span className="shrink-0">{timeAgo(listing.postedAt)}</span>
        </div>
      </div>
    </Link>
  );
}

export function ListingCardSkeleton() {
  return (
    <div>
      <Skeleton className="aspect-square w-full rounded-3xl" />
      <div className="space-y-1.5 px-1 pt-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3.5 w-4/5" />
        <Skeleton className="h-3 w-2/3" />
      </div>
    </div>
  );
}

export function ListingGrid({ listings, from = 0 }) {
  return (
    <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
      {listings.map((l, i) => (
        <ListingCard key={l.id} listing={l} index={i + from} />
      ))}
    </div>
  );
}
