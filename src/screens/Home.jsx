import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Bell, Sun, Moon, MapPin, TrendingUp, Clock, Sparkles, ChevronRight } from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { ListingCard, ListingCardSkeleton } from '../components/ListingCard.jsx';
import { Category3DIcon } from '../components/Category3DIcon.jsx';
import { SectionHeader } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { runNaturalSearch } from '../lib/nlSearch.js';
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

// Carousel card width: ~two full cards plus a deliberate slice of the next, so
// the peek reads as "swipe for more" rather than an accidental crop. Capped so
// tablets/desktop simply fit more cards instead of inflating them.
function RailCard({ listing }) {
  return (
    <div className="w-[40vw] min-w-[132px] max-w-[172px] shrink-0">
      <ListingCard listing={listing} />
    </div>
  );
}

// Section heading with a one-line purpose so each rail's intent is obvious.
function RailHeader({ icon, title, note, action, to = '/search' }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3 px-1">
      <div className="min-w-0">
        <h2 className="flex items-center gap-2 text-lg font-bold tracking-tight text-ink">
          {icon} {title}
        </h2>
        {note && <p className="mt-0.5 truncate text-xs text-faint">{note}</p>}
      </div>
      {action && (
        <Link to={to} className="press shrink-0 text-sm font-semibold text-accent">
          {action}
        </Link>
      )}
    </div>
  );
}

// One category tile: premium 3D icon + readable name. Width is driven by the
// grid cell; auto-hyphenation lets long single-word names wrap to a clean two
// lines instead of breaking awkwardly.
function CategoryTile({ c, size, labelClass }) {
  return (
    <Link
      to={`/category/${c.id}`}
      aria-label={c.label}
      className="press group flex flex-col items-center gap-1 text-center"
    >
      <Category3DIcon category={c} size={size} className="transition-transform group-hover:-translate-y-0.5" />
      <span className={`line-clamp-2 w-full hyphens-auto font-semibold leading-[1.15] text-ink [overflow-wrap:anywhere] ${labelClass}`}>
        {c.label}
      </span>
    </Link>
  );
}

// Compact, non-scrolling two-row directory: all 14 categories fit in a 7×2
// grid, visible at once, reading left→right then onto the second row. Icons
// shrink on phones and grow on larger screens, but it's always exactly two
// rows — no horizontal scroll, no cut-off.
function CategoryGrid() {
  return (
    <>
      {/* phones: smaller icons + tight labels so all 14 fit two rows */}
      <div className="mt-1 grid grid-cols-7 gap-x-0.5 gap-y-2.5 md:hidden">
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.id} c={c} size={36} labelClass="text-[8.5px]" />
        ))}
      </div>
      {/* md+: same two-row grid with room for larger icons */}
      <div className="mt-1 hidden grid-cols-7 gap-x-2 gap-y-4 md:grid">
        {CATEGORIES.map((c) => (
          <CategoryTile key={c.id} c={c} size={48} labelClass="text-[11px]" />
        ))}
      </div>
    </>
  );
}

function HomeHeader() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const unread = state.notifications.filter((n) => !n.read).length;
  const isDark = state.theme === 'dark';
  return (
    <div className="glass sticky top-0 z-30 safe-top">
      <Container size="max-w-5xl" className="flex items-center gap-3 py-2.5">
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
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const { bind, indicator } = usePullToRefresh();
  const [q, setQ] = useState('');

  const submitSearch = () => {
    const text = q.trim();
    if (!text) { navigate('/search'); return; }
    const res = runNaturalSearch(text, dispatch, navigate);
    if (res.summary) toast(`AI found: ${res.summary}`, { type: 'info' });
    setQ('');
  };

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

      <Container size="max-w-5xl" className="pt-3">
        {/* Hero — compact, search-first (capped so it never stretches on desktop) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="max-w-2xl"
        >
          <h1 className="text-2xl font-extrabold tracking-tight text-ink sm:text-3xl">
            {/* national colours, used once: the word in flag green over the
                flag's red · black · orange stripes */}
            <span className="relative inline-block" style={{ color: 'rgb(var(--zm-green))' }}>
              Zambia's
              <span aria-hidden className="absolute inset-x-0 -bottom-0.5 flex h-[3px] overflow-hidden rounded-full">
                <span className="flex-1" style={{ background: 'rgb(var(--zm-red))' }} />
                <span className="flex-1" style={{ background: 'rgb(var(--zm-black))' }} />
                <span className="flex-1" style={{ background: 'rgb(var(--zm-orange))' }} />
              </span>
            </span>{' '}
            smarter marketplace.
          </h1>

          <form
            onSubmit={(e) => { e.preventDefault(); submitSearch(); }}
            className="mt-3 flex items-center gap-2 rounded-2xl border border-hairline bg-surface p-1.5 pl-4 shadow-soft focus-within:shadow-lift"
          >
            <Search size={20} className="shrink-0 text-faint" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Try “electric SUV in Lusaka under K2m”"
              className="min-w-0 flex-1 bg-transparent py-2 text-[15px] text-ink outline-none placeholder:text-faint"
            />
            <button
              type="submit"
              className="press inline-flex shrink-0 items-center gap-1 rounded-xl btn-accent px-3 py-2 text-sm font-bold"
            >
              <Sparkles size={14} /> AI
            </button>
          </form>
        </motion.div>

        {/* Categories — compact two-row grid, sitting close under the search
            bar so search + categories read as one primary discovery area. */}
        <div className="mt-4">
          <SectionHeader title="Browse categories" />
          <CategoryGrid />
        </div>

        {/* Recently viewed */}
        {recent.length > 0 && (
          <section className="mt-8">
            <SectionHeader title="Recently viewed" action="Clear" onAction={() => {}} />
            <Rail>
              {recent.map((l) => <RailCard key={l.id} listing={l} />)}
            </Rail>
          </section>
        )}

        {/* Trending — what buyers are looking at right now */}
        <section className="mt-8">
          <RailHeader
            icon={<TrendingUp size={19} className="text-accent" />}
            title="Trending now"
            note="Most viewed by buyers this week"
            action="See all"
          />
          <Rail>
            {trending.map((l) => <RailCard key={l.id} listing={l} />)}
          </Rail>
        </section>

        {/* Premium picks — seller-promoted, higher-tier listings */}
        <section className="mt-8">
          <RailHeader
            icon={<Sparkles size={19} className="text-gold" />}
            title="Premium picks"
            note="Promoted listings from Premium & Gold sellers"
            action="See all"
          />
          <Rail>
            {premium.map((l) => <RailCard key={l.id} listing={l} />)}
          </Rail>
        </section>

        {/* Nearby */}
        <section className="mt-8">
          <RailHeader
            icon={<MapPin size={19} className="text-accent" />}
            title="Nearby"
            note={`Close to ${CURRENT_USER.location.split(',')[0]}`}
            action="See all"
          />
          <Rail>
            {nearby.map((l) => <RailCard key={l.id} listing={l} />)}
          </Rail>
        </section>

        {/* Latest — full grid */}
        <section className="mt-8 pb-8">
          <SectionHeader title="Fresh finds" action="Browse all" onAction={() => navigate('/search')} />
          <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {latest.map((l, i) => (
              <ListingCard key={l.id} listing={l} index={i} />
            ))}
          </div>
        </section>
      </Container>
    </div>
  );
}
