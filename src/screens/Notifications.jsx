import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingDown, Search, Heart, Bell, CheckCheck } from 'lucide-react';
import { ScreenHeader, Container } from '../components/layout/Header.jsx';
import { EmptyState } from '../components/ui/kit.jsx';
import { useStore } from '../lib/store.jsx';
import { timeAgo } from '../lib/format.js';

const ICONS = {
  message: { icon: MessageCircle, tone: 'text-accent bg-accent-soft' },
  price: { icon: TrendingDown, tone: 'text-success bg-success/12' },
  search: { icon: Search, tone: 'text-accent bg-accent-soft' },
  favorite: { icon: Heart, tone: 'text-danger bg-danger/12' },
  system: { icon: Bell, tone: 'text-muted bg-ink/5' },
};

export default function Notifications() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const notifs = state.notifications;
  const unread = notifs.filter((n) => !n.read).length;

  const open = (n) => {
    dispatch({ type: 'READ_NOTIFICATION', id: n.id });
    if (n.meta?.convId) navigate(`/messages/${n.meta.convId}`);
    else if (n.meta?.listingId) navigate(`/listing/${n.meta.listingId}`);
  };

  return (
    <div className="lg:pb-8">
      <ScreenHeader
        title="Notifications"
        back
        right={
          unread > 0 && (
            <button
              onClick={() => dispatch({ type: 'READ_ALL_NOTIFICATIONS' })}
              className="press inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-semibold text-ink"
            >
              <CheckCheck size={15} /> Mark all
            </button>
          )
        }
      />
      <Container className="pt-2">
        {notifs.length === 0 ? (
          <EmptyState icon={Bell} title="You're all caught up" body="Notifications about messages, price drops and matches appear here." />
        ) : (
          <div className="space-y-1">
            {notifs.map((n, i) => {
              const conf = ICONS[n.type] || ICONS.system;
              const Icon = conf.icon;
              return (
                <motion.button
                  key={n.id}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.25) }}
                  onClick={() => open(n)}
                  className={`press flex w-full items-start gap-3 rounded-2xl p-3 text-left transition ${
                    n.read ? '' : 'bg-accent-soft/40'
                  }`}
                >
                  <span className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl ${conf.tone}`}>
                    <Icon size={20} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-bold text-ink">{n.title}</p>
                      {!n.read && <span className="h-2 w-2 shrink-0 rounded-full bg-accent" />}
                    </div>
                    <p className="text-sm text-muted">{n.body}</p>
                    <p className="mt-0.5 text-xs text-faint">{timeAgo(n.at)}</p>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}
