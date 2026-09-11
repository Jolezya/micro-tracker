import React, { useMemo, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Apple, ArrowRight, ArrowLeft, Eye, EyeOff, ShieldCheck, Zap, Heart, AlertCircle, MapPin } from 'lucide-react';
import { Logo } from '../components/layout/Logo.jsx';
import { Button, Spinner } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useStore } from '../lib/store.jsx';
import { TOWN_NAMES } from '../data/locations.js';
import {
  signUp, signIn, makeAccount, validateName, passwordStrength, gateReason,
} from '../lib/auth.js';

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

function Field({ label, error, children, hint }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-semibold text-ink">{label}</span>
      {children}
      {error ? (
        <span className="mt-1.5 flex items-center gap-1 text-xs font-medium text-danger">
          <AlertCircle size={13} /> {error}
        </span>
      ) : hint ? (
        <span className="mt-1.5 block text-xs text-faint">{hint}</span>
      ) : null}
    </label>
  );
}

const inputCls = (bad) =>
  `focus-ring h-12 w-full rounded-2xl border bg-surface px-4 text-[15px] text-ink outline-none placeholder:text-faint ${
    bad ? 'border-danger' : 'border-hairline'
  }`;

export default function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  // Where to go afterwards, and why we asked. Both come from the gate that
  // sent the user here, so they land back on what they were doing.
  const returnTo = location.state?.returnTo || '/';

  // Leaving without signing up is a real history step back — NOT a navigate to
  // returnTo, which is the screen that gated you and would gate you again.
  // `key === 'default'` means /auth was opened cold (shared link, refresh), so
  // there is nothing behind it and home is the only sensible exit.
  const goBack = () => {
    if (location.key === 'default') navigate('/', { replace: true });
    else navigate(-1);
  };
  const reason = location.state?.reason ? gateReason(location.state.reason) : null;

  const [mode, setMode] = useState(location.state?.mode === 'signin' ? 'signin' : 'signup');
  const [step, setStep] = useState('credentials'); // credentials | profile
  const [form, setForm] = useState({ name: '', email: '', password: '', town: '' });
  const [errors, setErrors] = useState({});
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(null);
  const [draftUser, setDraftUser] = useState(null);

  const set = (patch) => { setForm((f) => ({ ...f, ...patch })); setErrors({}); };
  const strength = useMemo(() => passwordStrength(form.password), [form.password]);

  const done = (user, message) => {
    dispatch({ type: user.isNew ? 'SIGN_UP' : 'SIGN_IN', user });
    toast(message);
    navigate(returnTo, { replace: true });
  };

  // --- email + password ---
  const submitCredentials = (e) => {
    e?.preventDefault();
    setLoading('email');
    // Kept async-shaped so swapping in a real API later changes only this block.
    setTimeout(() => {
      if (mode === 'signin') {
        const res = signIn(state.accounts, { email: form.email, password: form.password });
        setLoading(null);
        if (res.error) { setErrors({ [res.field]: res.error }); return; }
        done({ ...res.user, isNew: false }, `Welcome back, ${res.user.name.split(' ')[0]} 👋`);
        return;
      }
      const res = signUp(state.accounts, { name: form.name, email: form.email, password: form.password });
      setLoading(null);
      if (res.error) { setErrors({ [res.field]: res.error }); return; }
      // Account is valid — collect the town before finishing so the first
      // listing and nearby results have somewhere to anchor.
      setDraftUser(res.user);
      setStep('profile');
    }, 650);
  };

  // --- one-tap providers (no per-signup cost) ---
  const withProvider = (provider) => {
    setLoading(provider);
    setTimeout(() => {
      const email = `you@${provider === 'google' ? 'gmail.com' : 'icloud.com'}`;
      const existing = state.accounts.find((a) => a.email === email);
      setLoading(null);
      if (existing) { done({ ...existing, isNew: false }, `Welcome back, ${existing.name.split(' ')[0]} 👋`); return; }
      setDraftUser(makeAccount({ name: '', email, provider }));
      setMode('signup');
      setStep('profile');
    }, 700);
  };

  // --- profile step ---
  const finishProfile = (e) => {
    e?.preventDefault();
    const nameErr = validateName(form.name || draftUser?.name);
    if (nameErr) { setErrors({ name: nameErr }); return; }
    if (!form.town) { setErrors({ town: 'Choose your town so buyers nearby can find you' }); return; }
    const name = (form.name || draftUser.name).trim();
    const user = {
      ...draftUser,
      name,
      handle: name.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'kaira',
      location: form.town,
      isNew: true,
    };
    done(user, 'Welcome to Kaira 🎉');
  };

  const busy = !!loading;

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-bg">
      <div className="safe-top" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-4">
        {/* Back / close */}
        <button
          onClick={() => (step === 'profile' ? setStep('credentials') : goBack())}
          className="press -ml-1 mb-2 grid h-10 w-10 place-items-center rounded-full text-ink hover:bg-ink/5"
          aria-label="Back"
        >
          <ArrowLeft size={20} />
        </button>

        {step === 'credentials' ? (
          <motion.div key="cred" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-6">
              <Logo size={48} />
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-ink">
                {mode === 'signin' ? 'Welcome back' : 'Create your account'}
              </h1>
              {/* When a gate sent them here, lead with the reason. */}
              <p className="mt-2 text-muted">
                {reason || 'Free to join. Browse, buy and sell across Zambia.'}
              </p>
            </div>

            {/* Free, one-tap options first — they cost nothing and convert best */}
            <div className="space-y-2.5">
              <button
                onClick={() => withProvider('google')}
                disabled={busy}
                className="press focus-ring flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-hairline bg-surface text-[15px] font-bold text-ink disabled:opacity-60"
              >
                {loading === 'google' ? <Spinner size={18} /> : <GoogleIcon />} Continue with Google
              </button>
              <button
                onClick={() => withProvider('apple')}
                disabled={busy}
                className="press focus-ring flex h-12 w-full items-center justify-center gap-2.5 rounded-2xl border border-hairline bg-surface text-[15px] font-bold text-ink disabled:opacity-60"
              >
                {loading === 'apple' ? <Spinner size={18} /> : <Apple size={18} />} Continue with Apple
              </button>
            </div>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-line/15" />
              <span className="text-xs font-semibold text-faint">or use email</span>
              <span className="h-px flex-1 bg-line/15" />
            </div>

            <form onSubmit={submitCredentials} noValidate className="space-y-3.5">
              {mode === 'signup' && (
                <Field label="Full name" error={errors.name}>
                  <input
                    value={form.name}
                    onChange={(e) => set({ name: e.target.value })}
                    placeholder="e.g. Chanda Mwale"
                    autoComplete="name"
                    className={inputCls(errors.name)}
                  />
                </Field>
              )}
              <Field label="Email" error={errors.email}>
                <input
                  type="email"
                  inputMode="email"
                  value={form.email}
                  onChange={(e) => set({ email: e.target.value })}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={inputCls(errors.email)}
                />
              </Field>
              <Field
                label="Password"
                error={errors.password}
                hint={mode === 'signup' && form.password ? `Strength: ${strength.label}` : mode === 'signup' ? 'At least 8 characters' : null}
              >
                <div className="relative">
                  <input
                    type={showPw ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => set({ password: e.target.value })}
                    placeholder={mode === 'signup' ? 'Create a password' : 'Your password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className={`${inputCls(errors.password)} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? 'Hide password' : 'Show password'}
                    className="press absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ink"
                  >
                    {showPw ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </Field>

              {mode === 'signup' && form.password && (
                <div className="flex gap-1" aria-hidden>
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className={`h-1 flex-1 rounded-full transition ${
                        strength.score > i ? (strength.score === 1 ? 'bg-warning' : strength.score === 2 ? 'bg-accent/60' : 'bg-success') : 'bg-ink/10'
                      }`}
                    />
                  ))}
                </div>
              )}

              <Button full size="lg" type="submit" disabled={busy}>
                {loading === 'email' ? <Spinner size={18} /> : <Mail size={18} />}
                {mode === 'signin' ? 'Sign in' : 'Create account'}
              </Button>
            </form>

            <p className="mt-5 text-center text-sm text-muted">
              {mode === 'signin' ? 'New to Kaira?' : 'Already have an account?'}{' '}
              <button
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setErrors({}); }}
                className="press font-bold text-accent"
              >
                {mode === 'signin' ? 'Create an account' : 'Sign in'}
              </button>
            </p>

            <div className="mt-7 flex justify-center gap-5 text-center text-xs font-medium text-muted">
              <span className="flex flex-col items-center gap-1"><ShieldCheck size={17} className="text-accent" /> Verified sellers</span>
              <span className="flex flex-col items-center gap-1"><Zap size={17} className="text-accent" /> Free to list</span>
              <span className="flex flex-col items-center gap-1"><Heart size={17} className="text-accent" /> Save favourites</span>
            </div>

            <p className="mt-6 text-center text-xs leading-relaxed text-faint">
              By continuing you agree to Kaira’s Terms and Privacy Policy.
            </p>
          </motion.div>
        ) : (
          /* ---------- Profile step ---------- */
          <motion.div key="profile" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
            <div className="mb-6">
              <h1 className="text-3xl font-extrabold tracking-tight text-ink">Almost there</h1>
              <p className="mt-2 text-muted">Just your name and town — this is what buyers see.</p>
            </div>

            <form onSubmit={finishProfile} noValidate className="space-y-4">
              <Field label="Full name" error={errors.name}>
                <input
                  value={form.name || draftUser?.name || ''}
                  onChange={(e) => set({ name: e.target.value })}
                  placeholder="e.g. Chanda Mwale"
                  autoComplete="name"
                  className={inputCls(errors.name)}
                />
              </Field>

              <Field label="Town" error={errors.town} hint="Buyers nearby see your listings first">
                <div className="relative">
                  <MapPin size={16} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-faint" />
                  <select
                    value={form.town}
                    onChange={(e) => set({ town: e.target.value })}
                    className={`${inputCls(errors.town)} appearance-none pl-10`}
                  >
                    <option value="">Choose your town…</option>
                    {TOWN_NAMES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </Field>

              <Button full size="lg" type="submit">
                Start using Kaira <ArrowRight size={18} />
              </Button>
            </form>

            {/* Sets the expectation early: phone is only needed to sell. */}
            <p className="mt-5 rounded-2xl bg-ink/[0.04] p-3.5 text-xs leading-relaxed text-muted">
              You can browse, save and message straight away. We’ll only ask to verify your mobile
              number when you list your first item — that’s what earns your seller badge.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
