import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, X, Crown, Sparkles, Building2, ChevronLeft } from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Button, Badge, Segmented } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useStore } from '../lib/store.jsx';
import { PLANS } from '../data/plans.js';
import { kr } from '../lib/format.js';

export default function Plans() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [cycle, setCycle] = useState('monthly');

  const yearly = cycle === 'yearly';
  const choose = (plan) => {
    if (plan.id === 'enterprise') {
      toast('Thanks! Our team will be in touch about Enterprise.', { type: 'info' });
      return;
    }
    dispatch({ type: 'SET_PLAN', plan: plan.id });
    dispatch({ type: 'ADD_NOTIFICATION', notification: { type: 'system', title: 'Subscription updated', body: `You're now on ${plan.name}` } });
    toast(plan.id === 'free' ? 'Switched to Free' : `Welcome to ${plan.name} 🎉`);
  };

  return (
    <div className="pb-28 lg:pb-10">
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="flex items-center gap-3 py-2.5">
          <button onClick={() => navigate(-1)} className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink">
            <ChevronLeft size={20} />
          </button>
          <h1 className="text-lg font-bold text-ink">Plans & pricing</h1>
        </Container>
      </div>

      <Container className="pt-5">
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1 text-xs font-bold text-accent">
            <Sparkles size={13} /> Sell smarter
          </span>
          <h2 className="mt-3 text-3xl font-extrabold tracking-tight text-ink text-balance">Choose the plan that fits you</h2>
          <p className="mx-auto mt-2 max-w-md text-muted">No payment is processed in Kaira — plans simply unlock features. Buyers and sellers always settle their own way.</p>
        </div>

        <div className="mt-5 flex justify-center">
          <Segmented
            options={[
              { value: 'monthly', label: 'Monthly' },
              { value: 'yearly', label: 'Yearly · save 20%' },
            ]}
            value={cycle}
            onChange={setCycle}
            className="w-full max-w-xs"
          />
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
          {PLANS.map((plan, i) => {
            const current = state.plan === plan.id;
            const price = plan.price == null ? null : yearly ? Math.round(plan.price * 12 * 0.8) : plan.price;
            const Icon = plan.id === 'gold' ? Crown : plan.id === 'enterprise' ? Building2 : plan.id === 'premium' ? Sparkles : Check;
            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                className={`relative flex flex-col rounded-3xl border p-5 ${
                  plan.popular ? 'border-accent shadow-lift' : 'border-hairline'
                } bg-surface`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-ink">
                    Most popular
                  </span>
                )}
                <div className="flex items-center gap-2">
                  <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${plan.accent}1f`, color: plan.accent }}>
                    <Icon size={18} />
                  </span>
                  <h3 className="text-lg font-extrabold text-ink">{plan.name}</h3>
                </div>
                <p className="mt-2 text-sm text-muted">{plan.tagline}</p>

                <div className="mt-4 flex items-end gap-1">
                  {plan.price == null ? (
                    <span className="text-2xl font-extrabold text-ink">{plan.priceLabel}</span>
                  ) : plan.price === 0 ? (
                    <span className="text-3xl font-extrabold text-ink">Free</span>
                  ) : (
                    <>
                      <span className="text-3xl font-extrabold text-ink">{kr(price)}</span>
                      <span className="mb-1 text-sm text-muted">/{yearly ? 'yr' : 'mo'}</span>
                    </>
                  )}
                </div>

                <Button
                  className="mt-4"
                  full
                  variant={current ? 'outline' : plan.popular ? 'accent' : 'soft'}
                  disabled={current}
                  onClick={() => choose(plan)}
                >
                  {current ? 'Current plan' : plan.id === 'enterprise' ? 'Contact sales' : plan.id === 'free' ? 'Switch to Free' : `Get ${plan.name}`}
                </Button>

                <ul className="mt-5 space-y-2.5">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5 text-sm">
                      {f.included ? (
                        <Check size={17} className="mt-0.5 shrink-0 text-accent" strokeWidth={2.6} />
                      ) : (
                        <X size={17} className="mt-0.5 shrink-0 text-faint" />
                      )}
                      <span className={f.included ? 'text-ink' : 'text-faint line-through'}>
                        {f.text}
                        {f.note && <span className="ml-1 text-xs text-faint">(free tier)</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-faint">
          Prices in NOK. Cancel anytime. Kaira never processes buyer–seller payments.
        </p>
      </Container>
    </div>
  );
}
