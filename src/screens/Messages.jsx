import React from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, Search } from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { ListingImage } from '../components/ListingImage.jsx';
import { Avatar, EmptyState, Button } from '../components/ui/kit.jsx';
import { useAllListings, useStore } from '../lib/store.jsx';
import { getUser } from '../data/users.js';
import { timeAgo } from '../lib/format.js';

export default function Messages() {
  const { state } = useStore();
  const all = useAllListings();

  const convs = [...state.conversations].sort((a, b) => {
    const la = a.messages[a.messages.length - 1]?.at || 0;
    const lb = b.messages[b.messages.length - 1]?.at || 0;
    return Date.parse(lb) - Date.parse(la);
  });

  return (
    <div className="lg:pb-8">
      <ScreenHeader title="Messages" />
      <Container className="pt-2">
        {convs.length === 0 ? (
          <EmptyState
            icon={MessageCircle}
            title="No messages yet"
            body="When you contact a seller, your conversations show up here."
            action={<Button as={Link} to="/search">Browse listings</Button>}
          />
        ) : (
          <div className="divide-y divide-line/10">
            {convs.map((c) => {
              const seller = getUser(c.sellerId);
              const listing = all.find((l) => l.id === c.listingId);
              const last = c.messages[c.messages.length - 1];
              return (
                <Link
                  key={c.id}
                  to={`/messages/${c.id}`}
                  className="press flex items-center gap-3 py-3 transition"
                >
                  <div className="relative shrink-0">
                    <Avatar name={seller?.name} size={52} />
                    <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full bg-success ring-2 ring-bg" title="Online" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="truncate font-bold text-ink">{seller?.name}</p>
                      <span className="shrink-0 text-xs text-faint">{last ? timeAgo(last.at) : ''}</span>
                    </div>
                    <div className="flex items-center justify-between gap-2">
                      <p className={`truncate text-sm ${c.unread ? 'font-semibold text-ink' : 'text-muted'}`}>
                        {last ? (last.from === 'me' ? 'You: ' : '') + last.text : 'Say hello 👋'}
                      </p>
                      {c.unread > 0 && (
                        <span className="grid h-5 min-w-5 shrink-0 place-items-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-ink">
                          {c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                  {listing && (
                    <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                      <ListingImage listing={listing} className="h-full w-full" glyphSize={18} minimal />
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
