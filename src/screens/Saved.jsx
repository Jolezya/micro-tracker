import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Heart, Bookmark, Search, Trash2, Bell } from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { ListingGrid } from '../components/ListingCard.jsx';
import { Button, EmptyState, Segmented } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useAllListings, useStore } from '../lib/store.jsx';

export default function Saved() {
  const navigate = useNavigate();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [tab, setTab] = useState('items');

  const saved = useMemo(
    () => state.saved.map((id) => all.find((l) => l.id === id)).filter(Boolean),
    [state.saved, all]
  );

  return (
    <div className="pb-8">
      <ScreenHeader title="Saved" back />
      <Container className="pt-2">
        <Segmented
          options={[
            { value: 'items', label: `Items (${saved.length})` },
            { value: 'searches', label: `Searches (${state.savedSearches.length})` },
          ]}
          value={tab}
          onChange={setTab}
          className="max-w-sm"
        />

        <div className="mt-5">
          {tab === 'items' ? (
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
          ) : state.savedSearches.length ? (
            <div className="space-y-2">
              {state.savedSearches.map((s) => (
                <div key={s.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-accent-soft text-accent">
                    <Search size={18} />
                  </span>
                  <button onClick={() => navigate('/search')} className="min-w-0 flex-1 text-left">
                    <p className="truncate font-semibold text-ink">{s.label}</p>
                    <p className="flex items-center gap-1 text-xs text-muted"><Bell size={11} /> Alerts on · new matches notify you</p>
                  </button>
                  <button
                    onClick={() => {
                      dispatch({ type: 'REMOVE_SEARCH', id: s.id });
                      toast('Saved search removed');
                    }}
                    className="press grid h-9 w-9 place-items-center rounded-full text-muted hover:text-danger"
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
          )}
        </div>
      </Container>
    </div>
  );
}
