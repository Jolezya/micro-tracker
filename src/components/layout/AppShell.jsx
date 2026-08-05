import React from 'react';
import { NavLink, Outlet, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, Search, Plus, MessageCircle, User, Bell, Sparkles } from 'lucide-react';
import { useStore } from '../../lib/store.jsx';
import { Logo } from './Logo.jsx';

const NAV = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/search', label: 'Search', icon: Search },
  { to: '/sell', label: 'Sell', icon: Plus, primary: true },
  { to: '/messages', label: 'Messages', icon: MessageCircle, badgeKey: 'messages' },
  { to: '/profile', label: 'Profile', icon: User },
];

function useBadges() {
  const { state } = useStore();
  const messages = state.conversations.reduce((a, c) => a + (c.unread || 0), 0);
  const notifications = state.notifications.filter((n) => !n.read).length;
  return { messages, notifications };
}

// ---------------- Mobile bottom nav ----------------
function BottomNav() {
  const badges = useBadges();
  return (
    <nav className="glass fixed inset-x-0 bottom-0 z-40 border-t lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around px-2 pb-safe pt-1.5">
        {NAV.map((item) => {
          const Icon = item.icon;
          if (item.primary) {
            return (
              <Link
                key={item.to}
                to={item.to}
                aria-label="Sell"
                className="press relative -mt-5 flex flex-col items-center"
              >
                <span className="grid h-14 w-14 place-items-center rounded-2xl btn-accent shadow-glow">
                  <Icon size={26} strokeWidth={2.4} />
                </span>
              </Link>
            );
          }
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className="press relative flex flex-1 flex-col items-center gap-0.5 py-1.5"
            >
              {({ isActive }) => (
                <>
                  <span className="relative">
                    <Icon
                      size={23}
                      strokeWidth={isActive ? 2.5 : 2}
                      className={isActive ? 'text-accent' : 'text-faint'}
                    />
                    {badge > 0 && (
                      <span className="absolute -right-2 -top-1.5 grid h-4 min-w-4 place-items-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                        {badge}
                      </span>
                    )}
                  </span>
                  <span className={`text-[10px] font-semibold ${isActive ? 'text-accent' : 'text-faint'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}

// ---------------- Desktop sidebar ----------------
function SideNav() {
  const badges = useBadges();
  return (
    <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-hairline px-4 py-6 lg:flex">
      <Link to="/" className="mb-8 flex items-center gap-2 px-2">
        <Logo size={34} />
        <span className="text-xl font-extrabold tracking-tight text-ink">Kaira</span>
      </Link>
      <nav className="flex flex-1 flex-col gap-1">
        {NAV.map((item) => {
          const Icon = item.icon;
          const badge = item.badgeKey ? badges[item.badgeKey] : 0;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `press relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition ${
                  isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-elevated hover:text-ink'
                }`
              }
            >
              <Icon size={21} strokeWidth={2.1} />
              {item.label}
              {badge > 0 && (
                <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
                  {badge}
                </span>
              )}
            </NavLink>
          );
        })}
        <NavLink
          to="/notifications"
          className={({ isActive }) =>
            `press relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-[15px] font-semibold transition ${
              isActive ? 'bg-accent-soft text-accent' : 'text-muted hover:bg-elevated hover:text-ink'
            }`
          }
        >
          <Bell size={21} strokeWidth={2.1} />
          Notifications
          {badges.notifications > 0 && (
            <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-danger px-1.5 text-[11px] font-bold text-white">
              {badges.notifications}
            </span>
          )}
        </NavLink>
      </nav>
      <Link
        to="/plans"
        className="press mt-4 flex items-center gap-3 rounded-2xl bg-gradient-to-br from-accent to-[#0a4d3c] px-4 py-3 text-white"
      >
        <Sparkles size={20} />
        <div className="leading-tight">
          <p className="text-sm font-bold">Go Premium</p>
          <p className="text-xs text-white/70">Sell more, faster</p>
        </div>
      </Link>
    </aside>
  );
}

export function AppShell() {
  const location = useLocation();
  return (
    <div className="mx-auto flex min-h-[100dvh] w-full max-w-[1400px]">
      <SideNav />
      <main className="min-w-0 flex-1 pb-24 lg:pb-0">
        <motion.div
          key={location.pathname.split('/')[1] || 'home'}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
      <BottomNav />
    </div>
  );
}
