import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Crown, Sparkles, Rocket, ChevronRight, Zap, ArrowUpRight, Clock } from 'lucide-react';
import { Sheet } from '../ui/Sheet.jsx';
import { Button, Badge } from '../ui/kit.jsx';
import { useToast } from '../ui/Toast.jsx';
import { useStore } from '../../lib/store.jsx';
import { kwacha } from '../../lib/format.js';
import {
  LISTING_PLANS, LISTING_PLAN_MAP, BOOST_OPTIONS, planBenefits, boostReach,
} from '../../data/plans.js';

const PLAN_ICON = { premium: Sparkles, gold: Crown, mahala: Check };

export function PlanBenefitList({ planId, category, className = '' }) {
  const { inherits, items } = useMemo(() => planBenefits(planId, category), [planId, category]);
  const accent = LISTING_PLAN_MAP[planId]?.accent || '#0f6c54';
  return (
    <ul className={`space-y-2 ${className}`}>
      {inherits && (
        <li className="flex items-center gap-2 text-sm font-semibold text-ink">
          <Check size={15} className="shrink-0" style={{ color: accent }} strokeWidth={2.8} />
          Everything in {inherits}
        </li>
      )}
      {items.map((it) => (
        <li key={it.text} className="flex items-start gap-2 text-sm text-muted">
          <Check size={15} className="mt-0.5 shrink-0" style={{ color: accent }} strokeWidth={2.6} />
          <span className="text-ink/90">{it.text}</span>
        </li>
      ))}
    </ul>
  );
}

// ---------------- Boost sheet ----------------
export function BoostSheet({ open, onClose, listing }) {
  const { dispatch } = useStore();
  const { toast } = useToast();
  const [sel, setSel] = useState('b3');
  const planId = listing?.listingPlan || 'mahala';
  const opt = BOOST_OPTIONS.find((b) => b.id === sel);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="🚀 Boost your listing"
      footer={
        <Button
          full
          size="lg"
          onClick={() => {
            dispatch({ type: 'BOOST_LISTING', id: listing.id, boostId: sel });
            dispatch({ type: 'ADD_NOTIFICATION', notification: { type: 'system', title: 'Listing boosted 🚀', body: `${listing.title} is boosted for ${opt.label}` } });
            toast(`Boosted for ${opt.label} 🚀`);
            onClose();
          }}
        >
          <Rocket size={18} /> Boost for {kwacha(opt.price)}
        </Button>
      }
    >
      <p className="mb-3 text-sm text-muted">Get more visibility for a limited time — no need to change your plan.</p>
      <div className="mb-3 flex items-center gap-2 rounded-xl bg-accent-soft px-3 py-2.5 text-sm font-medium text-accent">
        <Zap size={16} className="shrink-0" /> {boostReach(planId)}
      </div>
      <div className="space-y-2 pb-2">
        {BOOST_OPTIONS.map((b) => {
          const active = sel === b.id;
          return (
            <button
              key={b.id}
              onClick={() => setSel(b.id)}
              className={`press flex w-full items-center gap-3 rounded-2xl border p-3.5 text-left transition ${
                active ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface'
              }`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${active ? 'btn-accent' : 'bg-ink/5 text-ink'}`}>
                <Rocket size={18} />
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-ink">{b.label}</p>
                  {b.popular && <Badge tone="accent">Popular</Badge>}
                </div>
                <p className="text-xs text-muted">{b.blurb}</p>
              </div>
              <span className="text-base font-extrabold text-ink">{kwacha(b.price)}</span>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---------------- Upgrade sheet ----------------
export function UpgradeSheet({ open, onClose, listing }) {
  const { dispatch } = useStore();
  const { toast } = useToast();
  const current = listing?.listingPlan || 'mahala';
  const category = listing?.category;
  const order = ['mahala', 'premium', 'gold'];
  const higher = LISTING_PLANS.filter((p) => order.indexOf(p.id) > order.indexOf(current));
  const [sel, setSel] = useState(higher[0]?.id);
  const plan = LISTING_PLAN_MAP[sel];

  if (!higher.length) return null;

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Upgrade your listing"
      footer={
        plan && (
          <Button
            full
            size="lg"
            onClick={() => {
              dispatch({ type: 'UPGRADE_LISTING', id: listing.id, plan: sel });
              dispatch({ type: 'ADD_NOTIFICATION', notification: { type: 'system', title: `Upgraded to ${plan.name}`, body: `${listing.title} now has ${plan.name} visibility` } });
              toast(`Upgraded to ${plan.name} 🎉`);
              onClose();
            }}
          >
            Upgrade to {plan.name} · {kwacha(plan.price)}
          </Button>
        )
      }
    >
      <p className="mb-3 text-sm text-muted">More visibility, instantly — your listing stays live, nothing to recreate.</p>
      <div className="space-y-2">
        {higher.map((p) => {
          const active = sel === p.id;
          const Icon = PLAN_ICON[p.id] || Sparkles;
          return (
            <button key={p.id} onClick={() => setSel(p.id)} className={`press block w-full rounded-2xl border p-3.5 text-left transition ${active ? 'border-accent shadow-soft' : 'border-hairline'} bg-surface`}>
              <div className="flex items-center gap-2">
                <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${p.accent}1f`, color: p.accent }}>
                  <Icon size={18} />
                </span>
                <div className="flex-1">
                  <p className="font-extrabold text-ink">{p.name} <span className="text-sm font-medium text-muted">· {p.subtitle}</span></p>
                  <p className="text-xs text-muted">{p.positioning}</p>
                </div>
                <span className="text-base font-extrabold text-ink">{kwacha(p.price)}</span>
              </div>
              {active && (
                <div className="mt-3 border-t border-hairline pt-3">
                  <PlanBenefitList planId={p.id} category={category} />
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---------------- Owner "your listing is live" panel ----------------
export function LivePlanPanel({ listing }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showBoost, setShowBoost] = useState(false);
  const planId = listing.listingPlan || 'mahala';
  const plan = LISTING_PLAN_MAP[planId];
  const boosted = listing.boostedUntil && listing.boostedUntil > Date.now();
  const boostHrs = boosted ? Math.max(1, Math.round((listing.boostedUntil - Date.now()) / 3600000)) : 0;
  const canUpgrade = planId !== 'gold';

  return (
    <div className="rounded-3xl border border-hairline bg-surface p-4">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full bg-success" />
        <p className="text-sm font-bold text-ink">Your listing is live</p>
        <span className="ml-auto text-xs font-semibold" style={{ color: plan.accent }}>
          {plan.emoji} {plan.name}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{plan.visibility}{boosted && ` · 🚀 Boosted, ${boostHrs}h left`}</p>

      <div className="mt-3 flex flex-wrap gap-2">
        {canUpgrade && (
          <Button size="sm" onClick={() => setShowUpgrade(true)}>
            <ArrowUpRight size={16} /> Upgrade to {planId === 'mahala' ? 'Premium' : 'Gold'}
          </Button>
        )}
        <Button size="sm" variant={boosted ? 'outline' : 'soft'} onClick={() => setShowBoost(true)}>
          <Rocket size={16} /> {boosted ? 'Extend boost' : 'Boost'}
        </Button>
        <Button size="sm" variant="ghost" as={Link} to="/plans">
          Compare plans <ChevronRight size={15} />
        </Button>
      </div>

      <UpgradeSheet open={showUpgrade} onClose={() => setShowUpgrade(false)} listing={listing} />
      <BoostSheet open={showBoost} onClose={() => setShowBoost(false)} listing={listing} />
    </div>
  );
}
