import React, { useState } from 'react';
import { ShieldCheck, Phone, ArrowRight, AlertCircle } from 'lucide-react';
import { Sheet } from '../ui/Sheet.jsx';
import { Button, Spinner } from '../ui/kit.jsx';
import { useStore } from '../../lib/store.jsx';
import { useToast } from '../ui/Toast.jsx';
import { normalisePhone, validatePhone, makeOtp, checkOtp } from '../../lib/auth.js';

// The only step in the funnel that costs money to run (an SMS to a Zambian
// number). It is deliberately asked for here — at the first listing — rather
// than at signup, so the cost falls on the small share of users who actually
// sell, and buys them the "Verified" badge that makes their listing credible.
export function PhoneVerifySheet({ open, onClose, onVerified }) {
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [stage, setStage] = useState('number'); // number | code
  const [phone, setPhone] = useState(state.auth.user?.phone || '');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const reset = () => { setStage('number'); setCode(''); setSent(null); setError(null); setBusy(false); };
  const close = () => { reset(); onClose?.(); };

  const send = () => {
    const err = validatePhone(phone);
    if (err) { setError(err); return; }
    setBusy(true);
    setError(null);
    setTimeout(() => {
      const otp = makeOtp();
      setSent(otp);
      setStage('code');
      setBusy(false);
      // Local demo: the code is surfaced instead of being texted. A real build
      // sends it server-side and never returns it to the client.
      toast(`Demo code: ${otp}`, { type: 'info' });
    }, 700);
  };

  const confirm = () => {
    const err = checkOtp(sent, code);
    if (err) { setError(err); return; }
    setBusy(true);
    setTimeout(() => {
      dispatch({ type: 'VERIFY_PHONE', phone: normalisePhone(phone) });
      setBusy(false);
      toast('Mobile number verified ✓');
      close();
      onVerified?.();
    }, 500);
  };

  return (
    <Sheet open={open} onClose={close} title={stage === 'number' ? 'Verify your mobile number' : 'Enter the code'}>
      <div className="space-y-4 pb-2">
        {stage === 'number' ? (
          <>
            <div className="flex gap-3 rounded-2xl bg-accent-soft p-3.5">
              <ShieldCheck size={20} className="mt-0.5 shrink-0 text-accent" />
              <p className="text-sm leading-relaxed text-ink">
                Buyers trust listings from verified sellers. This is a one-time step — you keep the
                badge on every listing you post.
              </p>
            </div>

            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Mobile number</span>
              <div className="relative">
                <Phone size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
                <input
                  value={phone}
                  onChange={(e) => { setPhone(e.target.value); setError(null); }}
                  inputMode="tel"
                  autoComplete="tel"
                  placeholder="0977 123 456"
                  className={`focus-ring h-12 w-full rounded-2xl border bg-surface pl-10 pr-4 text-[15px] text-ink outline-none placeholder:text-faint ${
                    error ? 'border-danger' : 'border-hairline'
                  }`}
                />
              </div>
              {error ? (
                <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger"><AlertCircle size={13} /> {error}</span>
              ) : (
                <span className="mt-1.5 block text-xs text-faint">MTN, Airtel or Zamtel · we never show this publicly</span>
              )}
            </label>

            <Button full size="lg" onClick={send} disabled={busy}>
              {busy ? <Spinner size={18} /> : <ArrowRight size={18} />} Send code
            </Button>
          </>
        ) : (
          <>
            <p className="text-sm text-muted">
              We sent a 6-digit code to <span className="font-semibold text-ink">{normalisePhone(phone)}</span>.
            </p>
            <input
              value={code}
              onChange={(e) => { setCode(e.target.value.replace(/\D/g, '').slice(0, 6)); setError(null); }}
              inputMode="numeric"
              autoComplete="one-time-code"
              placeholder="000000"
              className={`focus-ring h-14 w-full rounded-2xl border bg-surface text-center text-2xl font-extrabold tracking-[0.4em] text-ink outline-none placeholder:text-faint ${
                error ? 'border-danger' : 'border-hairline'
              }`}
            />
            {error && (
              <span className="flex items-center gap-1 text-xs font-medium text-danger"><AlertCircle size={13} /> {error}</span>
            )}
            <Button full size="lg" onClick={confirm} disabled={busy}>
              {busy ? <Spinner size={18} /> : <ShieldCheck size={18} />} Verify and publish
            </Button>
            <button onClick={() => { setStage('number'); setCode(''); setError(null); }} className="press w-full text-center text-sm font-semibold text-muted">
              Change number
            </button>
          </>
        )}
      </div>
    </Sheet>
  );
}
