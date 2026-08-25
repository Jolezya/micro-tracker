import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  ChevronLeft, Heart, Share2, Flag, MapPin, MessageCircle, Phone, ShieldCheck,
  Clock, Eye, Tag, ChevronRight, Sparkles, BadgeCheck, Pencil,
} from 'lucide-react';
import { Gallery } from '../components/Gallery.jsx';
import { MapView } from '../components/MapView.jsx';
import { ListingCard } from '../components/ListingCard.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { Container } from '../components/layout/Header.jsx';
import { Button, Badge, Avatar, Stars, PlanBadge, VerifiedBadge, EmptyState } from '../components/ui/kit.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useAllListings, useStore } from '../lib/store.jsx';
import { getUser } from '../data/users.js';
import { CATEGORY_MAP } from '../data/categories.js';
import { galleryImages } from '../lib/media.js';
import { LivePlanPanel } from '../components/plan/PlanUI.jsx';
import { formatPrice, timeAgo, memberSince, distanceKm, formatDistance, compactNumber } from '../lib/format.js';
import { recommend, fraudScore } from '../lib/ai.js';
import { CURRENT_USER } from '../data/users.js';

export default function ListingDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [report, setReport] = useState(false);

  const listing = all.find((l) => l.id === id);

  useEffect(() => {
    if (listing) dispatch({ type: 'VIEW', id: listing.id });
    window.scrollTo(0, 0);
  }, [id]); // eslint-disable-line

  const cat = listing ? CATEGORY_MAP[listing.category] : null;
  const tint = cat?.color || '#0f6c54';
  const photos = useMemo(() => (listing ? galleryImages(listing) : []), [listing]);
  const related = useMemo(() => (listing ? recommend(listing, all) : []), [listing, all]);
  const trust = useMemo(() => (listing ? fraudScore(listing, all) : null), [listing, all]);

  if (!listing) {
    return (
      <Container className="pt-10">
        <EmptyState icon={Tag} title="Listing not found" body="It may have been sold or removed." action={<Button onClick={() => navigate('/')}>Back home</Button>} />
      </Container>
    );
  }

  const seller = getUser(listing.sellerId) || CURRENT_USER;
  const saved = state.saved.includes(listing.id);
  const dist = distanceKm(CURRENT_USER, listing.location);
  const mine = listing.mine || listing.sellerId === CURRENT_USER.id;

  const onShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: listing.title, url });
      } catch {
        /* cancelled */
      }
    } else {
      navigator.clipboard?.writeText(url);
      toast('Link copied to clipboard');
    }
  };

  const onMessage = () => {
    dispatch({ type: 'START_CONVERSATION', sellerId: seller.id, listingId: listing.id });
    const conv = state.conversations.find((c) => c.sellerId === seller.id && c.listingId === listing.id);
    navigate(`/messages/${conv ? conv.id : 'new'}`, { state: { sellerId: seller.id, listingId: listing.id } });
  };

  return (
    <div className="pb-cta lg:pb-8">
      {/* Floating top controls over gallery */}
      <div className="relative">
        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center justify-between p-3 safe-top">
          <button
            onClick={() => navigate(-1)}
            className="press glass pointer-events-auto grid h-10 w-10 place-items-center rounded-full text-ink"
            aria-label="Back"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="pointer-events-auto flex gap-2">
            <button onClick={onShare} className="press glass grid h-10 w-10 place-items-center rounded-full text-ink" aria-label="Share">
              <Share2 size={18} />
            </button>
            <button
              onClick={() => dispatch({ type: 'TOGGLE_SAVE', id: listing.id })}
              className="press glass grid h-10 w-10 place-items-center rounded-full"
              aria-label="Save"
            >
              <Heart size={18} className={saved ? 'text-danger' : 'text-ink'} fill={saved ? 'currentColor' : 'none'} />
            </button>
          </div>
        </div>
        <Gallery photos={photos} alt={listing.title} />
      </div>

      <Container className="pt-4">
        {/* Title + price */}
        <div className="flex items-start gap-3">
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 flex flex-wrap items-center gap-2">
              <Badge tone="accent" icon={() => <CategoryIcon name={cat?.icon} size={12} />}>
                {cat?.label}
              </Badge>
              {listing.premium && <Badge tone="gold" icon={Sparkles}>Premium</Badge>}
              {listing.condition && <Badge>{listing.condition}</Badge>}
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight text-ink text-balance">{listing.title}</h1>
          </div>
        </div>

        <div className="mt-2 flex items-end justify-between">
          <p className="text-3xl font-extrabold text-ink">{formatPrice(listing)}</p>
          {listing.negotiable && <span className="mb-1 text-sm font-medium text-muted">Negotiable</span>}
        </div>

        {/* Meta row */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1">
            <MapPin size={14} /> {listing.location.area}, {listing.location.city}
            {dist != null && <span className="text-faint">· {formatDistance(dist)}</span>}
          </span>
          <span className="inline-flex items-center gap-1">
            <Clock size={14} /> {timeAgo(listing.postedAt)}
          </span>
          <span className="inline-flex items-center gap-1">
            <Eye size={14} /> {compactNumber(listing.views)} views
          </span>
        </div>

        {/* Owner panel — upgrade / boost your own live listing */}
        {mine && (
          <div className="mt-4 space-y-3">
            <Link
              to={`/sell/${listing.id}`}
              className="press flex items-center justify-center gap-2 rounded-2xl border border-hairline bg-surface py-3 text-sm font-bold text-ink"
            >
              <Pencil size={16} /> Edit listing
            </Link>
            <LivePlanPanel listing={listing} />
          </div>
        )}

        {/* Trust bar */}
        {!mine && trust && (
          <div className="mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
            <span
              className={`grid h-10 w-10 shrink-0 place-items-center rounded-full ${
                trust.risk === 'low' ? 'bg-success/12 text-success' : trust.risk === 'medium' ? 'bg-warning/12 text-warning' : 'bg-danger/12 text-danger'
              }`}
            >
              <ShieldCheck size={20} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold text-ink">
                {trust.risk === 'low' ? 'Looks trustworthy' : trust.risk === 'medium' ? 'Trade with care' : 'Be cautious'}
              </p>
              <p className="text-xs text-muted">
                {trust.flags.length ? trust.flags[0] : 'Verified seller · consistent pricing · complete details'}
              </p>
            </div>
            <span className="text-lg font-extrabold text-ink">{Math.round(trust.score * 100)}</span>
          </div>
        )}

        {/* Seller */}
        <Link
          to={`/seller/${seller.id}`}
          className="press mt-4 flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3 transition hover:bg-elevated"
        >
          <Avatar name={seller.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-1.5">
              <p className="truncate font-bold text-ink">{seller.name}</p>
              {seller.verified?.includes('id') && <VerifiedBadge size={15} />}
              <PlanBadge plan={seller.plan} />
            </div>
            <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted">
              <Stars rating={seller.rating} size={12} />
              <span>· {seller.reviews} deals</span>
              <span>· Member since {memberSince(seller.memberSince).split(' ')[1]}</span>
              <span>· Replies {seller.responseTime}</span>
            </div>
            {/* verification chips — subtle trust signals */}
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {seller.business && <TrustChip>Verified business</TrustChip>}
              {seller.verified?.includes('id') && <TrustChip>ID verified</TrustChip>}
              {seller.verified?.includes('phone') && <TrustChip>Phone verified</TrustChip>}
            </div>
          </div>
          <ChevronRight size={20} className="shrink-0 self-start text-faint" />
        </Link>

        {/* Description */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-ink">Description</h2>
          <p className="whitespace-pre-line text-[15px] leading-relaxed text-muted">{listing.description}</p>
        </section>

        {/* Tags */}
        {listing.tags?.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {listing.tags.map((t) => (
              <span key={t} className="rounded-full bg-ink/5 px-3 py-1.5 text-sm font-medium text-muted">
                {t}
              </span>
            ))}
          </div>
        )}

        {/* Specifications */}
        {listing.specs && Object.keys(listing.specs).length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 text-lg font-bold text-ink">Specifications</h2>
            <div className="overflow-hidden rounded-2xl border border-hairline">
              {Object.entries(listing.specs).map(([k, v], i) => (
                <div
                  key={k}
                  className={`flex items-center justify-between px-4 py-3 text-[15px] ${
                    i % 2 ? 'bg-surface' : 'bg-elevated/50'
                  }`}
                >
                  <span className="text-muted">{k}</span>
                  <span className="font-semibold text-ink">{v}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Location */}
        <section className="mt-6">
          <h2 className="mb-2 text-lg font-bold text-ink">Location</h2>
          <MapView listings={[listing]} />
        </section>

        {/* Report */}
        <button
          onClick={() => setReport(true)}
          className="press mt-5 inline-flex items-center gap-2 text-sm font-semibold text-muted"
        >
          <Flag size={15} /> Report this listing
        </button>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-bold text-ink">Similar listings</h2>
            <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {related.map((l) => (
                <div key={l.id} className="w-40 shrink-0 sm:w-44">
                  <ListingCard listing={l} />
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Sticky action bar — hidden on your own listing */}
      {!mine && (
        <div className="dock-above fixed inset-x-0 z-40 px-3 lg:bottom-0 lg:px-0">
          <div className="glass mx-auto flex max-w-3xl items-center gap-3 border-t px-4 py-3 pb-safe">
            <Button variant="outline" size="lg" onClick={() => toast(`Calling ${seller.name.split(' ')[0]}…`, { type: 'info' })} className="flex-1">
              <Phone size={18} /> Call
            </Button>
            <Button size="lg" onClick={onMessage} className="flex-[2]">
              <MessageCircle size={18} /> Message seller
            </Button>
          </div>
        </div>
      )}

      {/* Report sheet */}
      <Sheet open={report} onClose={() => setReport(false)} title="Report listing">
        <div className="space-y-2 pb-3">
          {['Suspected scam or fraud', 'Prohibited item', 'Wrong category', 'Offensive content', 'Duplicate listing', 'Other'].map((r) => (
            <button
              key={r}
              onClick={() => {
                setReport(false);
                toast('Thanks — our moderation team will review this');
              }}
              className="press flex w-full items-center justify-between rounded-xl px-4 py-3.5 text-left text-[15px] font-medium text-ink hover:bg-elevated"
            >
              {r}
              <ChevronRight size={18} className="text-faint" />
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function TrustChip({ children }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent">
      <BadgeCheck size={11} strokeWidth={2.6} /> {children}
    </span>
  );
}
