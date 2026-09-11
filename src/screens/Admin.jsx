import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid,
} from 'recharts';
import {
  Users, Package, TrendingUp, Flag, ShieldCheck, ChevronLeft, Check, Trash2,
  CreditCard, Activity, LayoutGrid, ScrollText, ListPlus,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Badge, Avatar, Segmented } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { LISTINGS } from '../data/listings.js';
import { USERS } from '../data/users.js';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories.js';
import { PLANS } from '../data/plans.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import { compactNumber, kr, timeAgo } from '../lib/format.js';

const ACCENT = '#0f6c54';
const TRAFFIC = [
  { d: 'Mon', v: 4200, l: 62 }, { d: 'Tue', v: 5100, l: 71 }, { d: 'Wed', v: 4800, l: 68 },
  { d: 'Thu', v: 6400, l: 88 }, { d: 'Fri', v: 8200, l: 104 }, { d: 'Sat', v: 9100, l: 96 },
  { d: 'Sun', v: 7300, l: 79 },
];
const REPORTS = [
  { id: 'r1', listing: 'l_pokemon', reason: 'Possible counterfeit', reporter: 'Thandiwe M.', when: '2h ago' },
  { id: 'r2', listing: 'l_gucci', reason: 'Suspected replica', reporter: 'Kelvin S.', when: '5h ago' },
  { id: 'r3', listing: 'l_iphone', reason: 'Price too good — scam?', reporter: 'Lweendo N.', when: '1d ago' },
];
const AUDIT = [
  { who: 'admin@kaira.zm', action: 'Approved listing', target: 'BMW M3 Competition', when: '12 min ago' },
  { who: 'moderation-bot', action: 'Flagged for review', target: 'Rolex Submariner', when: '48 min ago' },
  { who: 'chandam', action: 'Upgraded to Gold', target: 'Subscription', when: '3h ago' },
  { who: 'admin@kaira.zm', action: 'Removed listing', target: 'Duplicate: PS5 bundle', when: '1d ago' },
  { who: 'zambezimotors', action: 'Bulk uploaded', target: '14 vehicles', when: '2d ago' },
];

export default function Admin() {
  const navigate = useNavigate();
  const all = useAllListings();
  const { toast } = useToast();
  const [tab, setTab] = useState('overview');
  const [queue, setQueue] = useState(REPORTS);

  const stats = useMemo(() => {
    const totalViews = all.reduce((a, l) => a + (l.views || 0), 0);
    const byCat = CATEGORIES.map((c) => ({
      name: c.label,
      value: all.filter((l) => l.category === c.id).length,
      color: c.color,
    }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);
    const mrr = USERS.reduce((a, u) => {
      const p = PLANS.find((pl) => pl.id === u.plan);
      return a + (p?.price || 0);
    }, 0);
    return { totalViews, byCat, mrr };
  }, [all]);

  const resolve = (id, action) => {
    setQueue((q) => q.filter((r) => r.id !== id));
    toast(action === 'remove' ? 'Listing removed' : 'Report dismissed');
  };

  return (
    <div className="lg:pb-8">
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="flex items-center gap-3 py-2.5" size="max-w-6xl">
          <button onClick={() => navigate(-1)} aria-label="Back" className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
            <ChevronLeft size={20} />
          </button>
          <div className="flex-1">
            <h1 className="flex items-center gap-2 text-lg font-bold text-ink">
              <ShieldCheck size={20} className="text-accent" /> Admin
            </h1>
          </div>
          <Badge tone="accent">Live</Badge>
        </Container>
      </div>

      <Container size="max-w-6xl" className="pt-4">
        <Segmented
          options={[
            { value: 'overview', label: 'Overview', icon: <Activity size={15} /> },
            { value: 'moderation', label: `Moderation (${queue.length})`, icon: <Flag size={15} /> },
            { value: 'audit', label: 'Audit log', icon: <ScrollText size={15} /> },
          ]}
          value={tab}
          onChange={setTab}
          className="max-w-lg"
        />

        {tab === 'overview' && (
          <div className="mt-5 space-y-5">
            {/* KPI cards */}
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Kpi icon={Users} label="Total users" value={compactNumber(USERS.length * 1580 + 2)} delta="+8.2%" />
              <Kpi icon={Package} label="Active listings" value={compactNumber(all.length * 421)} delta="+3.1%" />
              <Kpi icon={TrendingUp} label="Views this week" value={compactNumber(stats.totalViews)} delta="+12.4%" />
              <Kpi icon={CreditCard} label="MRR (subs)" value={kr(stats.mrr * 1240)} delta="+5.6%" />
            </div>

            {/* Traffic chart */}
            <div className="rounded-3xl border border-hairline bg-surface p-4">
              <h3 className="mb-3 flex items-center gap-2 font-bold text-ink"><Activity size={17} className="text-accent" /> Weekly activity</h3>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={TRAFFIC} margin={{ left: -20, right: 8, top: 8 }}>
                    <defs>
                      <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ACCENT} stopOpacity={0.4} />
                        <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                    <XAxis dataKey="d" tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ borderRadius: 12, border: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.15)', fontSize: 13 }}
                      labelStyle={{ fontWeight: 700 }}
                    />
                    <Area type="monotone" dataKey="v" name="Visits" stroke={ACCENT} strokeWidth={2.5} fill="url(#g1)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Two-up: categories + new listings */}
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="rounded-3xl border border-hairline bg-surface p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-ink"><LayoutGrid size={17} className="text-accent" /> Listings by category</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={stats.byCat} margin={{ left: -22, right: 8 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="currentColor" strokeOpacity={0.08} vertical={false} />
                      <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} interval={0} angle={-30} textAnchor="end" height={50} />
                      <YAxis tick={{ fontSize: 12, fill: 'currentColor', opacity: 0.5 }} axisLine={false} tickLine={false} />
                      <Tooltip cursor={{ fill: 'currentColor', opacity: 0.05 }} contentStyle={{ borderRadius: 12, border: 'none', fontSize: 13 }} />
                      <Bar dataKey="value" name="Listings" radius={[6, 6, 0, 0]}>
                        {stats.byCat.map((c, i) => (
                          <Cell key={i} fill={c.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-3xl border border-hairline bg-surface p-4">
                <h3 className="mb-3 flex items-center gap-2 font-bold text-ink"><CreditCard size={17} className="text-accent" /> Subscription mix</h3>
                <div className="flex h-56 items-center">
                  <ResponsiveContainer width="60%" height="100%">
                    <PieChart>
                      <Pie data={subMix(USERS)} dataKey="value" nameKey="name" innerRadius={40} outerRadius={70} paddingAngle={3}>
                        {subMix(USERS).map((s, i) => (
                          <Cell key={i} fill={s.color} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: 'none', fontSize: 13 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {subMix(USERS).map((s) => (
                      <div key={s.name} className="flex items-center gap-2 text-sm">
                        <span className="h-3 w-3 rounded-full" style={{ background: s.color }} />
                        <span className="flex-1 text-muted">{s.name}</span>
                        <span className="font-bold text-ink">{s.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Suggested list additions — custom values users typed for option fields */}
            <SuggestedAdditions />
          </div>
        )}

        {tab === 'moderation' && (
          <div className="mt-5 space-y-3">
            {queue.length === 0 ? (
              <div className="rounded-3xl border border-dashed border-line/20 p-10 text-center text-muted">
                <Check size={28} className="mx-auto mb-2 text-success" /> Queue clear — nothing to review.
              </div>
            ) : (
              queue.map((r) => {
                const listing = LISTINGS.find((l) => l.id === r.listing);
                return (
                  <div key={r.id} className="flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
                    <span className="grid h-11 w-11 place-items-center rounded-xl bg-danger/10 text-danger">
                      <Flag size={18} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-bold text-ink">{listing?.title || r.listing}</p>
                      <p className="text-sm text-muted">{r.reason}</p>
                      <p className="text-xs text-faint">Reported by {r.reporter} · {r.when}</p>
                    </div>
                    <button onClick={() => resolve(r.id, 'dismiss')} className="press grid h-10 w-10 place-items-center rounded-full bg-success/10 text-success" aria-label="Dismiss">
                      <Check size={18} />
                    </button>
                    <button onClick={() => resolve(r.id, 'remove')} className="press grid h-10 w-10 place-items-center rounded-full bg-danger/10 text-danger" aria-label="Remove">
                      <Trash2 size={18} />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        )}

        {tab === 'audit' && (
          <div className="mt-5 overflow-hidden rounded-3xl border border-hairline bg-surface">
            {AUDIT.map((a, i) => (
              <div key={i} className={`flex items-center gap-3 px-4 py-3 ${i ? 'border-t border-hairline' : ''}`}>
                <Avatar name={a.who} size={34} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-ink">
                    <span className="font-bold">{a.who}</span> {a.action} · <span className="text-muted">{a.target}</span>
                  </p>
                </div>
                <span className="shrink-0 text-xs text-faint">{a.when}</span>
              </div>
            ))}
          </div>
        )}
      </Container>
    </div>
  );
}

function SuggestedAdditions() {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const rows = Object.entries(state.customEntries || {})
    .map(([k, count]) => {
      const [field, value] = k.split('::');
      return { field, value, count };
    })
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  return (
    <div className="rounded-3xl border border-hairline bg-surface p-4">
      <h3 className="mb-1 flex items-center gap-2 font-bold text-ink"><ListPlus size={17} className="text-accent" /> Suggested list additions</h3>
      <p className="mb-3 text-sm text-muted">Custom values people typed for option fields. Recurring ones are candidates for the official lists.</p>
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line/20 p-6 text-center text-sm text-muted">
          Nothing yet — when sellers or buyers use “Other / Not listed?”, their entries show here for review.
        </p>
      ) : (
        <div className="divide-y divide-line/10">
          {rows.map((r) => (
            <div key={`${r.field}-${r.value}`} className="flex items-center gap-3 py-2.5">
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{r.value}</p>
                <p className="text-xs text-muted">field: {r.field}</p>
              </div>
              {r.count >= 3 && <Badge tone="accent">×{r.count} · flag</Badge>}
              {r.count < 3 && <span className="text-xs font-semibold text-faint">×{r.count}</span>}
              <button
                onClick={() => {
                  dispatch({ type: 'ADOPT_CUSTOM', field: r.field, value: r.value });
                  toast(`“${r.value}” added to the ${r.field} list`);
                }}
                className="press inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent"
              >
                <ListPlus size={12} /> Add to list
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function subMix(users) {
  const colors = { free: '#94a3b8', premium: '#0f6c54', gold: '#b08d4a', enterprise: '#4f46e5' };
  const counts = {};
  users.forEach((u) => (counts[u.plan] = (counts[u.plan] || 0) + 1));
  return Object.entries(counts).map(([k, v]) => ({ name: k[0].toUpperCase() + k.slice(1), value: v, color: colors[k] }));
}

function Kpi({ icon: Icon, label, value, delta }) {
  const up = delta.startsWith('+');
  return (
    <div className="rounded-2xl border border-hairline bg-surface p-4">
      <div className="flex items-center justify-between">
        <span className="grid h-9 w-9 place-items-center rounded-xl bg-accent-soft text-accent">
          <Icon size={18} />
        </span>
        <span className={`text-xs font-bold ${up ? 'text-success' : 'text-danger'}`}>{delta}</span>
      </div>
      <p className="mt-3 text-2xl font-extrabold text-ink">{value}</p>
      <p className="text-sm text-muted">{label}</p>
    </div>
  );
}
