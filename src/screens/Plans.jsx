import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Rocket, Building2, Check, ArrowRight, Sparkles } from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Button, Badge, Chip } from '../components/ui/kit.jsx';
import { PlanBenefitList } from '../components/plan/PlanUI.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { LISTING_PLANS, CORPORATE, BOOST_OPTIONS, SELL_PRINCIPLE, boostReach } from '../data/plans.js';
import { CATEGORIES } from '../data/categories.js';
import { kwacha } from '../lib/format.js';

const PREVIEW_CATS = [
  { id: null, label: 'General' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'property', label: 'Property' },
  { id: 'jobs', label: 'Jobs' },
  { id: 'electronics', label: 'Electronics' },
];

export default function Plans() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [cat, setCat] = useState(null);

  return (
    <div className="lg:pb-10">
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="flex items-center gap-3 py-2.5">
          <button onClick={() => navigate(-1)} className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink">Selling plans</h1>
        </Container>
      </div>

      <Container className="pt-5">
        {/* Principle */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            <Sparkles size={13} /> Mahala → Premium → Gold
          </span>
          <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-ink text-balance sm:text-3xl">{SELL_PRINCIPLE}</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">Paid plans sell visibility, exposure and speed — never basic access. And Kaira never processes the payment between you and your buyer.</p>
        </div>

        {/* Category preview */}
        <div className="mt-5">
          <p className="mb-2 text-center text-xs font-semibold uppercase tracking-wide text-faint">Preview benefits for</p>
          <div className="no-scrollbar -mx-4 flex justify-start gap-2 overflow-x-auto px-4 sm:justify-center">
            {PREVIEW_CATS.map((c) => (
              <Chip key={c.label} active={cat === c.id} onClick={() => setCat(c.id)}>{c.label}</Chip>
            ))}
          </div>
        </div>

        {/* Plan cards */}
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {LISTING_PLANS.map((p, i) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
              className={`relative flex flex-col rounded-3xl border p-5 ${p.recommended ? 'border-accent shadow-lift' : 'border-hairline'} bg-surface`}
            >
              {p.recommended && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                  Recommended
                </span>
              )}
              <div className="flex items-center gap-2">
                <span className="grid h-10 w-10 place-items-center rounded-xl text-2xl" style={{ background: `${p.accent}1f` }}>{p.emoji}</span>
                <div>
                  <h3 className="text-lg font-extrabold text-ink">{p.name}</h3>
                  <p className="text-xs font-semibold text-muted">{p.subtitle}</p>
                </div>
              </div>
              <p className="mt-2 text-sm text-muted">{p.positioning}</p>
              <div className="mt-3 flex items-end gap-1">
                <span className="text-3xl font-extrabold text-ink">{p.price === 0 ? 'Free' : kwacha(p.price)}</span>
                {p.price > 0 && <span className="mb-1 text-sm text-muted">/ listing</span>}
              </div>
              <div className="mt-2 flex flex-wrap gap-1.5">
                <Fact>{p.durationDays} days live</Fact>
                <Fact>{p.photoLimit} photos</Fact>
              </div>
              <Button className="mt-4" full variant={p.recommended ? 'accent' : 'soft'} onClick={() => navigate('/sell')}>
                Sell with {p.name}
              </Button>
              <div className="mt-4">
                <PlanBenefitList planId={p.id} category={cat} />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Boost */}
        <section className="mt-10">
          <div className="rounded-3xl border border-hairline bg-gradient-to-br from-[#ea580c1a] to-transparent p-5">
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-[#ea580c] text-white"><Rocket size={20} /></span>
              <div>
                <h3 className="text-lg font-extrabold text-ink">Boost — extra exposure, any plan</h3>
                <p className="text-sm text-muted">Already listed? Boost for a limited time without changing your plan.</p>
              </div>
            </div>
            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              {BOOST_OPTIONS.map((b) => (
                <div key={b.id} className={`rounded-2xl border bg-surface p-4 ${b.popular ? 'border-[#ea580c]' : 'border-hairline'}`}>
                  <div className="flex items-center justify-between">
                    <p className="font-bold text-ink">{b.label}</p>
                    {b.popular && <Badge tone="accent">Popular</Badge>}
                  </div>
                  <p className="mt-1 text-2xl font-extrabold text-ink">{kwacha(b.price)}</p>
                  <p className="text-xs text-muted">{b.blurb}</p>
                </div>
              ))}
            </div>
            <p className="mt-3 text-xs text-muted">Boost reach scales with your plan — {boostReach('gold')} on Gold.</p>
          </div>
        </section>

        {/* Corporate */}
        <section className="mt-8">
          <div className="rounded-3xl border p-5" style={{ borderColor: `${CORPORATE.accent}55`, background: `${CORPORATE.accent}0d` }}>
            <div className="flex items-center gap-2">
              <span className="grid h-10 w-10 place-items-center rounded-xl text-white" style={{ background: CORPORATE.accent }}><Building2 size={20} /></span>
              <div>
                <h3 className="text-lg font-extrabold text-ink">{CORPORATE.name} — {CORPORATE.subtitle}</h3>
                <p className="text-sm text-muted">{CORPORATE.positioning}</p>
              </div>
            </div>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {CORPORATE.features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm text-ink">
                  <Check size={15} className="mt-0.5 shrink-0" style={{ color: CORPORATE.accent }} strokeWidth={2.6} />
                  {f}
                </li>
              ))}
            </ul>
            <Button className="mt-4" style={{ background: CORPORATE.accent, color: '#fff' }} onClick={() => toast('Thanks! Our business team will reach out.', { type: 'info' })}>
              Talk to sales <ArrowRight size={16} />
            </Button>
          </div>
        </section>

        <p className="mt-8 text-center text-xs text-faint">Prices in Kwacha (ZMW), per listing. Cancel or change anytime.</p>
      </Container>
    </div>
  );
}

function Fact({ children }) {
  return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-muted">{children}</span>;
}
