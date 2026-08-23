import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Settings, Heart, Package, FileText, Bookmark, Users, Crown, ChevronRight,
  Moon, Sun, Bell, ShieldCheck, LogOut, LogIn, Sparkles, Eye, BarChart3, Trash2, Pencil,
  Rocket, ArrowUpRight,
} from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { ListingRow } from '../components/ListingCard.jsx';
import { Button, Avatar, PlanBadge, Badge, Switch, Segmented, EmptyState, Divider } from '../components/ui/kit.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { BoostSheet, UpgradeSheet } from '../components/plan/PlanUI.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useAllListings, useStore } from '../lib/store.jsx';
import { CURRENT_USER } from '../data/users.js';
import { PLAN_MAP, LISTING_PLAN_MAP } from '../data/plans.js';
import { compactNumber } from '../lib/format.js';

export default function Profile() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const all = useAllListings();
  const [settings, setSettings] = useState(false);
  const [notif, setNotif] = useState({ messages: true, price: true, searches: true, marketing: false });
  const [boostFor, setBoostFor] = useState(null);
  const [upgradeFor, setUpgradeFor] = useState(null);

  const isGuest = state.auth.status === 'guest';
  const user = state.auth.user || CURRENT_USER;
  const plan = PLAN_MAP[state.plan] || PLAN_MAP.free;
  const myListings = state.myListings;
  const saved = useMemo(() => state.saved.map((id) => all.find((l) => l.id === id)).filter(Boolean), [state.saved, all]);

  const totalViews = myListings.reduce((a, l) => a + (l.views || 0), 0);

  return (
    <div className="pb-8">
      <ScreenHeader
        title="Profile"
        right={
          <button onClick={() => setSettings(true)} className="press grid h-10 w-10 place-items-center rounded-full bg-ink/5 text-ink" aria-label="Settings">
            <Settings size={20} />
          </button>
        }
      />

      <Container>
        {/* Identity */}
        <div className="flex items-center gap-4 py-3">
          <Avatar name={user.name} size={72} className="shadow-soft" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-extrabold text-ink">{isGuest ? 'Guest' : user.name}</h1>
              {!isGuest && <PlanBadge plan={state.plan} />}
            </div>
            <p className="text-sm text-muted">{isGuest ? 'Browsing as guest' : `@${user.handle} · ${user.location}`}</p>
          </div>
        </div>

        {isGuest ? (
          <div className="rounded-3xl border border-hairline bg-gradient-to-br from-accent-soft to-transparent p-5">
            <h2 className="text-lg font-bold text-ink">Sign in to unlock everything</h2>
            <p className="mt-1 text-sm text-muted">Save listings, message sellers and start selling in seconds.</p>
            <Button className="mt-4" onClick={() => navigate('/auth')}>
              <LogIn size={18} /> Sign in or create account
            </Button>
          </div>
        ) : (
          <>
            {/* Upgrade banner */}
            {state.plan !== 'gold' && state.plan !== 'enterprise' && (
              <Link to="/plans" className="press flex items-center gap-3 rounded-3xl bg-gradient-to-br from-accent to-[#0a4d3c] p-4 text-white">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15">
                  <Crown size={22} />
                </span>
                <div className="flex-1">
                  <p className="font-bold">Upgrade to {state.plan === 'free' ? 'KA Premium' : 'KA Gold'}</p>
                  <p className="text-sm text-white/75">Rank higher, sell faster, unlock analytics</p>
                </div>
                <ChevronRight size={20} className="text-white/70" />
              </Link>
            )}

            {/* Seller stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              <Stat icon={Package} value={myListings.length} label="Active" />
              <Stat icon={Eye} value={compactNumber(totalViews)} label="Views" />
              <Stat icon={Heart} value={saved.length} label="Saved" />
            </div>
          </>
        )}

        {/* Quick links */}
        <div className="mt-5 overflow-hidden rounded-3xl border border-hairline bg-surface">
          <Row icon={Heart} label="Saved items" count={saved.length} to="/saved" />
          <Row icon={Bookmark} label="Saved searches" count={state.savedSearches.length} onClick={() => navigate('/search')} />
          <Row icon={Users} label="Following" count={state.following.length} onClick={() => toast(`Following ${state.following.length} sellers`)} />
          <Row icon={BarChart3} label="Seller analytics" to="/plans" />
          <Row icon={ShieldCheck} label="Admin dashboard" to="/admin" last />
        </div>

        {/* My listings */}
        <section className="mt-6">
          <h2 className="mb-2 px-1 text-lg font-bold text-ink">My listings</h2>
          {myListings.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-line/20 p-6 text-center">
              <p className="text-sm text-muted">You haven't listed anything yet.</p>
              <Button className="mt-3" variant="soft" onClick={() => navigate('/sell')}>
                <Sparkles size={16} /> Sell your first item
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {myListings.map((l) => {
                const lp = LISTING_PLAN_MAP[l.listingPlan || 'mahala'];
                const boosted = l.boostedUntil && l.boostedUntil > Date.now();
                return (
                  <div key={l.id} className="rounded-2xl border border-hairline bg-surface p-1.5">
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1">
                        <ListingRow listing={l} />
                      </div>
                      <button
                        onClick={() => { dispatch({ type: 'DELETE_LISTING', id: l.id }); toast('Listing removed'); }}
                        className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
                        aria-label="Delete"
                      >
                        <Trash2 size={17} />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 px-2 pb-1 pt-0.5">
                      <span className="text-xs font-bold" style={{ color: lp.accent }}>{lp.emoji} {lp.name}</span>
                      {boosted && <span className="text-xs font-bold text-[#ea580c]">🚀 Boosted</span>}
                      <div className="ml-auto flex items-center gap-1.5">
                        {l.listingPlan !== 'gold' && (
                          <button onClick={() => setUpgradeFor(l)} className="press inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
                            <ArrowUpRight size={13} /> Upgrade
                          </button>
                        )}
                        <button onClick={() => setBoostFor(l)} className="press inline-flex items-center gap-1 rounded-full bg-[#ea580c]/12 px-2.5 py-1 text-xs font-bold text-[#ea580c]">
                          <Rocket size={13} /> Boost
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {upgradeFor && <UpgradeSheet open listing={upgradeFor} onClose={() => setUpgradeFor(null)} />}
        {boostFor && <BoostSheet open listing={boostFor} onClose={() => setBoostFor(null)} />}

        {/* Drafts */}
        {state.drafts.length > 0 && (
          <section className="mt-6">
            <h2 className="mb-2 px-1 text-lg font-bold text-ink">Drafts</h2>
            <div className="space-y-2">
              {state.drafts.map((d) => (
                <div key={d.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <FileText size={18} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-ink">{d.title || 'Untitled draft'}</p>
                    <p className="text-xs text-muted">Draft · tap to continue</p>
                  </div>
                  <button onClick={() => navigate('/sell')} className="press grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => dispatch({ type: 'DELETE_DRAFT', id: d.id })}
                    className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:text-danger"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Settings sheet */}
      <Sheet open={settings} onClose={() => setSettings(false)} title="Settings">
        <div className="space-y-5 py-1">
          <div>
            <h3 className="mb-2 text-sm font-bold text-ink">Appearance</h3>
            <Segmented
              options={[
                { value: 'light', label: 'Light', icon: <Sun size={15} /> },
                { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
              ]}
              value={state.theme}
              onChange={(t) => dispatch({ type: 'SET_THEME', theme: t })}
              className="max-w-xs"
            />
          </div>

          <Divider />

          <div>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink"><Bell size={15} /> Notifications</h3>
            <div className="space-y-1">
              <ToggleRow label="New messages" checked={notif.messages} onChange={(v) => setNotif({ ...notif, messages: v })} />
              <ToggleRow label="Price drops on saved items" checked={notif.price} onChange={(v) => setNotif({ ...notif, price: v })} />
              <ToggleRow label="Saved search matches" checked={notif.searches} onChange={(v) => setNotif({ ...notif, searches: v })} />
              <ToggleRow label="Tips & offers" checked={notif.marketing} onChange={(v) => setNotif({ ...notif, marketing: v })} />
            </div>
          </div>

          <Divider />

          {state.auth.status === 'authed' ? (
            <Button
              variant="danger"
              full
              onClick={() => {
                dispatch({ type: 'SIGN_OUT' });
                setSettings(false);
                toast('Signed out');
              }}
            >
              <LogOut size={18} /> Sign out
            </Button>
          ) : (
            <Button full onClick={() => { setSettings(false); navigate('/auth'); }}>
              <LogIn size={18} /> Sign in
            </Button>
          )}
          <p className="pt-1 text-center text-xs text-faint">Kaira v1.0 · Made in Zambia 🇿🇲</p>
        </div>
      </Sheet>
    </div>
  );
}

function Stat({ icon: Icon, value, label }) {
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-3 text-center">
      <Icon size={18} className="mx-auto text-accent" />
      <p className="mt-1 text-lg font-extrabold text-ink">{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}

function Row({ icon: Icon, label, count, to, onClick, last }) {
  const inner = (
    <div className={`flex items-center gap-3 px-4 py-3.5 ${last ? '' : 'border-b border-hairline'}`}>
      <span className="grid h-9 w-9 place-items-center rounded-xl bg-ink/5 text-ink">
        <Icon size={18} />
      </span>
      <span className="flex-1 font-semibold text-ink">{label}</span>
      {count != null && <span className="text-sm font-semibold text-faint">{count}</span>}
      <ChevronRight size={18} className="text-faint" />
    </div>
  );
  if (to) return <Link to={to} className="press block hover:bg-elevated">{inner}</Link>;
  return <button onClick={onClick} className="press block w-full text-left hover:bg-elevated">{inner}</button>;
}

function ToggleRow({ label, checked, onChange }) {
  return (
    <div className="flex items-center justify-between py-2">
      <span className="text-[15px] text-ink">{label}</span>
      <Switch checked={checked} onChange={onChange} label={label} />
    </div>
  );
}
