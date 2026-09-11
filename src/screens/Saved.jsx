import React, { useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Search, Trash2, Bell, Users, ChevronRight, BadgeCheck } from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { ListingGrid } from '../components/ListingCard.jsx';
import { Avatar, Button, EmptyState, Segmented } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { getUser } from '../data/users.js';
import { useAllListings, useStore } from '../lib/store.jsx';

const TABS = ['items', 'searches', 'following'];

export default function Saved() {
  const navigate = useNavigate();
  const location = useLocation();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  // Profile links straight to a tab ("Saved searches", "Following"), so honour
  // the requested tab instead of always opening on Items.
  const [tab, setTab] = useState(() =>
    TABS.includes(location.state?.tab) ? location.state.tab : 'items'
  );

  const saved = useMemo(
    () => state.saved.map((id) => all.find((l) => l.id === id)).filter(Boolean),
    [state.saved, all]
  );

  const following = useMemo(
    () => state.following.map((id) => getUser(id)).filter(Boolean),
    [state.following]
  );

  // Reopening a saved search puts you back where you were: same category, same
  // query, same filters — not on a blank results page.
  const openSearch = (s) => {
    dispatch({ type: 'PATCH_SEARCH', patch: { q: s.q || '' } });
    if (s.category) {
      dispatch({ type: 'SET_CATEGORY_FILTERS', category: s.category, values: s.values || {} });
    }
    navigate(s.categoryId ? `/category/${s.categoryId}` : '/search');
  };

  return (
    <div className="lg:pb-8">
      <ScreenHeader title="Saved" back />
      <Container className="pt-2">
        <Segmented
          options={[
            { value: 'items', label: `Items (${saved.length})` },
            { value: 'searches', label: `Searches (${state.savedSearches.length})` },
            { value: 'following', label: `Following (${following.length})` },
          ]}
          value={tab}
          onChange={setTab}
          className="max-w-md"
        />

        <div className="mt-5">
          {tab === 'items' && (
            saved.length ? (
              <ListingGrid listings={saved} />
            ) : (
              <EmptyState
                icon={Heart}
                title="No saved items yet"
                body="Tap the heart on any listing to keep it here."
                action={<Button variant="soft" onClick={() => navigate('/search')}>Browse listings</Button>}
              />
            )
          )}

          {tab === 'searches' && (
            state.savedSearches.length ? (
              <div className="space-y-2">
                {state.savedSearches.map((s) => (
                  <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent-soft text-accent">
                      <Search size={18} />
                    </span>
                    <button onClick={() => openSearch(s)} className="min-w-0 flex-1 text-left">
                      <p className="truncate font-semibold text-ink">{s.label}</p>
                      <p className="flex items-center gap-1 text-xs text-muted">
                        <Bell size={11} /> Alerts on · new matches notify you
                      </p>
                    </button>
                    <button
                      onClick={() => {
                        dispatch({ type: 'REMOVE_SEARCH', id: s.id });
                        toast('Saved search removed');
                      }}
                      aria-label={`Remove saved search ${s.label}`}
                      className="press grid h-9 w-9 shrink-0 place-items-center rounded-full text-muted hover:text-danger"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Bookmark}
                title="No saved searches"
                body="Save a search to get notified the moment something matches."
                action={<Button variant="soft" onClick={() => navigate('/search')}>Start a search</Button>}
              />
            )
          )}

          {tab === 'following' && (
            following.length ? (
              <div className="space-y-2">
                {following.map((u) => (
                  <div key={u.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
                    <Link to={`/seller/${u.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                      <Avatar name={u.name} size={40} />
                      <span className="min-w-0">
                        <span className="flex items-center gap-1">
                          <span className="truncate font-semibold text-ink">{u.name}</span>
                          {u.verified?.length > 0 && <BadgeCheck size={14} className="shrink-0 text-accent" />}
                        </span>
                        <span className="block truncate text-xs text-muted">
                          @{u.handle} · {u.location}
                        </span>
                      </span>
                      <ChevronRight size={18} className="ml-auto shrink-0 text-faint" />
                    </Link>
                    <button
                      onClick={() => {
                        dispatch({ type: 'FOLLOW', id: u.id });
                        toast(`Unfollowed ${u.name.split(' ')[0]}`);
                      }}
                      className="press shrink-0 rounded-full bg-ink/5 px-3 py-1.5 text-xs font-bold text-ink"
                    >
                      Following
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Users}
                title="You're not following anyone yet"
                body="Follow a seller to see when they list something new."
                action={<Button variant="soft" onClick={() => navigate('/search')}>Find sellers</Button>}
              />
            )
          )}
        </div>
      </Container>
    </div>
  );
}
