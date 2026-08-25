import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  MapPin, Clock, ShieldCheck, Mail, Phone, BadgeCheck, Building2, MessageCircle, Star,
} from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { ListingGrid } from '../components/ListingCard.jsx';
import { Button, Avatar, Stars, PlanBadge, Badge, Segmented, EmptyState } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { getUser } from '../data/users.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import { memberSince, compactNumber } from '../lib/format.js';

const VERIF_LABELS = {
  email: { label: 'Email', icon: Mail },
  phone: { label: 'Phone', icon: Phone },
  id: { label: 'ID verified', icon: BadgeCheck },
  business: { label: 'Business', icon: Building2 },
};

const SAMPLE_REVIEWS = [
  { by: 'Sofie H.', rating: 5, text: 'Smooth, honest and fast. Item exactly as described. Would happily buy again!', when: '2 weeks ago' },
  { by: 'Markus L.', rating: 5, text: 'Great communication and flexible on pickup. Highly recommended seller.', when: '1 month ago' },
  { by: 'Nora B.', rating: 4, text: 'Good experience overall, packaging could have been a bit better.', when: '2 months ago' },
];

export default function SellerProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState('listings');

  const seller = getUser(id);
  const listings = useMemo(() => all.filter((l) => l.sellerId === id), [all, id]);
  const following = state.following.includes(id);

  if (!seller) {
    return (
      <>
        <ScreenHeader title="Seller" back />
        <Container className="pt-10">
          <EmptyState icon={ShieldCheck} title="Seller not found" />
        </Container>
      </>
    );
  }

  const toggleFollow = () => {
    dispatch({ type: 'FOLLOW', id });
    toast(following ? `Unfollowed ${seller.name}` : `Following ${seller.name}`);
  };

  return (
    <div className="lg:pb-8">
      <ScreenHeader title={seller.name} back />

      {/* Cover */}
      <div className="relative h-28 bg-gradient-to-br from-accent to-[#0a4d3c]" />
      <Container>
        <div className="-mt-10 flex items-end gap-3">
          <Avatar name={seller.name} size={84} ring className="shadow-lift" />
          <div className="flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-extrabold text-ink">{seller.name}</h1>
              <PlanBadge plan={seller.plan} />
            </div>
            <p className="text-sm text-muted">@{seller.handle}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-3 divide-x divide-line/10 rounded-2xl border border-hairline bg-surface py-3 text-center">
          <div>
            <div className="flex items-center justify-center">
              <Stars rating={seller.rating} size={15} />
            </div>
            <p className="mt-0.5 text-xs text-muted">{seller.reviews} reviews</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-ink">{compactNumber(seller.followers)}</p>
            <p className="text-xs text-muted">Followers</p>
          </div>
          <div>
            <p className="text-lg font-extrabold text-ink">{listings.length}</p>
            <p className="text-xs text-muted">Listings</p>
          </div>
        </div>

        {/* Meta */}
        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted">
          <span className="inline-flex items-center gap-1"><MapPin size={14} /> {seller.location}</span>
          <span className="inline-flex items-center gap-1"><Clock size={14} /> Replies {seller.responseTime}</span>
          <span className="inline-flex items-center gap-1">Member since {memberSince(seller.memberSince)}</span>
        </div>

        {seller.bio && <p className="mt-3 text-[15px] leading-relaxed text-muted">{seller.bio}</p>}

        {/* Verifications */}
        <div className="mt-3 flex flex-wrap gap-2">
          {seller.verified?.map((v) => {
            const info = VERIF_LABELS[v];
            if (!info) return null;
            const Icon = info.icon;
            return (
              <span key={v} className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
                <Icon size={13} /> {info.label}
              </span>
            );
          })}
        </div>

        {/* Actions */}
        <div className="mt-4 flex gap-3">
          <Button variant={following ? 'outline' : 'accent'} onClick={toggleFollow} className="flex-1">
            {following ? 'Following' : 'Follow'}
          </Button>
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => {
              const first = listings[0];
              dispatch({ type: 'START_CONVERSATION', sellerId: seller.id, listingId: first?.id });
              const conv = state.conversations.find((c) => c.sellerId === seller.id);
              navigate(`/messages/${conv ? conv.id : 'new'}`, { state: { sellerId: seller.id, listingId: first?.id } });
            }}
          >
            <MessageCircle size={18} /> Message
          </Button>
        </div>

        {/* Tabs */}
        <div className="mt-6">
          <Segmented
            options={[
              { value: 'listings', label: `Listings (${listings.length})` },
              { value: 'reviews', label: `Reviews (${seller.reviews})` },
            ]}
            value={tab}
            onChange={setTab}
            className="max-w-sm"
          />
        </div>

        <div className="mt-5">
          {tab === 'listings' ? (
            listings.length ? (
              <ListingGrid listings={listings} />
            ) : (
              <EmptyState icon={MapPin} title="No active listings" body="This seller has nothing listed right now." />
            )
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-4">
                <p className="text-4xl font-extrabold text-ink">{seller.rating.toFixed(1)}</p>
                <div>
                  <div className="flex">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} size={16} className="text-gold" fill={i < Math.round(seller.rating) ? 'currentColor' : 'none'} style={{ color: 'rgb(var(--gold))' }} />
                    ))}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">Based on {seller.reviews} reviews</p>
                </div>
              </div>
              {SAMPLE_REVIEWS.map((r, i) => (
                <div key={i} className="rounded-2xl border border-hairline bg-surface p-4">
                  <div className="flex items-center gap-2">
                    <Avatar name={r.by} size={32} />
                    <div className="flex-1">
                      <p className="text-sm font-bold text-ink">{r.by}</p>
                      <div className="flex items-center gap-1">
                        {Array.from({ length: 5 }).map((_, j) => (
                          <Star key={j} size={11} className="text-gold" fill={j < r.rating ? 'currentColor' : 'none'} style={{ color: 'rgb(var(--gold))' }} />
                        ))}
                        <span className="ml-1 text-xs text-faint">{r.when}</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-2 text-[15px] text-muted">{r.text}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </Container>
    </div>
  );
}
