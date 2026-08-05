import React, { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Sun, Moon, MapPin, TrendingUp, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ListingCard, ListingCardSkeleton } from '../components/ListingCard.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { SectionHeader } from '../components/ui/kit.jsx';
import { CATEGORIES } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { distanceKm } from '../lib/format.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import { usePullToRefresh } from '../lib/usePullToRefresh.jsx';

function greeting() {
  const h = new Date().getHours();
  if (h < 6) return 'Still up';
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

function Rail({ children }) {
  return (
    <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">{children}</div>
  );
}

function HomeHeader() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  const isDark = state.theme === 'dark';
  return (
    <div className="glass sticky top-0 z-30 safe-top">
      <Container className="flex items-center gap-3 py-2.5">
        <Link to="/" className="flex items-center gap-2">
          <Logo size={30} />
          <span className="text-xl font-extrabold tracking-tight text-ink lg:hidden">Kaira</span>
        </Link>
        <div className="ml-auto flex items-center gap-1">
          <button
            aria-label="Toggle theme"
            onClick={() => dispatch({ type: 'TOGGLE_THEME' })}
            className="press grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5"
          >
            {isDark ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          <button
            aria-label="Notifications"
            onClick={() => navigate('/notifications')}
            className="press relative grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5"
          >
            <Bell size={20} />
            {unread > 0 && (
              <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-danger ring-2 ring-bg" />
            )}
          </button>
        </div>
      </Container>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const all = useAllListings();
  const { state } = useStore();
  const { bind, indicator } = usePullToRefresh();

  const trending = useMemo(() => [...all].sort((a, b) => b.views - a.views).slice(0, 10), [all]);
  const premium = useMemo(() => all.filter((l) => l.premium).slice(0, 10), [all]);
  const latest = useMemo(
    () => [...all].sort((a, b) => Date.parse(b.postedAt) - Date.parse(a.postedAt)),
    [all]
  );
  const nearby = useMemo(() => {
    return [...all]
      .map((l) => ({ l, d: distanceKm(CURRENT_USER, l.location) ?? 9999 }))
      .sort((a, b) => a.d - b.d)
      .slice(0, 10)
      .map((x) => x.l);
  }, [all]);
  const recent = useMemo(
    () => state.recent.map((id) => all.find((l) => l.id === id)).filter(Boolean),
    [state.recent, all]
  );

  return (
    <div {...bind}>
      {indicator}
      <HomeHeader />

      <Container className="pt-4">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <p className="text-sm font-medium text-muted">
            {greeting()} — find something you'll love
          </p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-ink text-balance sm:text-4xl">
            The premium marketplace, <span className="text-gradient">reimagined</span>.
          </h1>

          <button
            onClick={() => navigate('/search')}
            className="press mt-4 flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3.5 text-left shadow-soft transition hover:shadow-lift"
          >
            <Search size={20} className="text-faint" />
            <span className="text-[15px] text-faint">Search cars, homes, watches…</span>
            <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
              <Sparkles size={12} /> AI
            </span>
          </button>
          <div className="mt-2 flex items-center gap-1 px-1 text-xs text-faint">
            <MapPin size={12} /> Showing results near {CURRENT_USER.location}
          </div>
        </motion.div>

        {/* Categories */}
        <div className="mt-6">
          <Rail>
            {CATEGORIES.map((c) => (
              <Link
                key={c.id}
                to={`/category/${c.id}`}
                className="press flex w-[76px] shrink-0 flex-col items-center gap-2"
              >
                <span
                  className="grid h-16 w-16 place-items-center rounded-2xl border border-hairline"
                  style={{ background: `${c.color}14`, color: c.color }}
                >
                  <CategoryIcon name={c.icon} size={24} strokeWidth={2} />
                </span>
                <span className="text-center text-[11px] font-semibold leading-tight text-muted">
                  {c.label}
                </span>
              </Link>
            ))}
          </Rail>
        </div>

        {/* Recently viewed */}
        {recent.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Recently viewed" action="Clear" onAction={() => {}} />
            <Rail>
              {recent.map((l) => (
                <div key={l.id} className="w-40 shrink-0 sm:w-44">
                  <ListingCard listing={l} />
                </div>
              ))}
            </Rail>
          </section>
        )}

        {/* Trending */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2 px-1">
            <TrendingUp size={20} className="text-accent" />
            <h2 className="text-lg font-bold tracking-tight text-ink">Trending now</h2>
          </div>
          <Rail>
            {trending.map((l) => (
              <div key={l.id} className="w-40 shrink-0 sm:w-44">
                <ListingCard listing={l} />
              </div>
            ))}
          </Rail>
        </section>

        {/* Premium picks */}
        <section className="mt-8">
          <div className="mb-3 flex items-center justify-between px-1">
            <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
              <Sparkles size={19} className="text-gold" /> Premium picks
            </h2>
            <Link to="/search" className="text-sm font-semibold text-accent">
              See all
            </Link>
          </div>
          <Rail>
            {premium.map((l) => (
              <div key={l.id} className="w-40 shrink-0 sm:w-44">
                <ListingCard listing={l} />
              </div>
            ))}
          </Rail>
        </section>

        {/* Nearby */}
        <section className="mt-8">
          <div className="mb-3 flex items-center gap-2 px-1">
            <MapPin size={19} className="text-accent" />
            <h2 className="text-lg font-bold tracking-tight text-ink">Nearby</h2>
          </div>
          <Rail>
            {nearby.map((l) => (
              <div key={l.id} className="w-40 shrink-0 sm:w-44">
                <ListingCard listing={l} />
              </div>
            ))}
          </Rail>
        </section>

        {/* Latest — full grid */}
        <section className="mt-8 pb-8">
          <SectionHeader title="Fresh finds" action="Browse all" onAction={() => navigate('/search')} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
            {latest.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
