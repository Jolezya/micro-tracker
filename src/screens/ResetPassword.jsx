import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { Button, Spinner } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { Logo } from '../components/layout/Logo.jsx';
import { useStore } from '../lib/store.jsx';
import { isConfigured } from '../lib/supabase.js';
import * as api from '../lib/backend.js';
import { validatePassword, passwordStrength } from '../lib/auth.js';

// The password-reset email lands here. Supabase turns the link's token into a
// short-lived "recovery" session (the auth listener flips state.recovery);
// all this screen has to do is accept a new password while that holds.
export default function ResetPassword() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);
  const [waited, setWaited] = useState(false);
  const strength = passwordStrength(pw);

  // Give the recovery token a moment to be exchanged before declaring the
  // link dead.
  useEffect(() => {
    const t = setTimeout(() => setWaited(true), 2500);
    return () => clearTimeout(t);
  }, []);

  const ready = isConfigured && (state.recovery || state.auth.status === 'authed');

  const submit = async (e) => {
    e?.preventDefault();
    const err = validatePassword(pw);
    if (err) { setError(err); return; }
    if (pw !== pw2) { setError('Those passwords don’t match'); return; }
    setBusy(true);
    await api.ensureClient();
    const r = await api.updatePassword(pw);
    setBusy(false);
    if (r.error) { setError(r.error); return; }
    dispatch({ type: 'SET_RECOVERY', local: true, value: false });
    toast('Password updated — you’re signed in');
    navigate('/profile', { replace: true });
  };

  const inputCls = 'focus-ring h-12 w-full rounded-2xl border border-hairline bg-surface px-4 pr-12 text-[15px] text-ink placeholder:text-faint';

  return (
    <div className="flex min-h-[100dvh] flex-col bg-bg">
      <div className="safe-top" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-8">
        <Logo size={44} />
        <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">Choose a new password</h1>

        {!isConfigured ? (
          <p className="mt-3 text-muted">Password reset isn’t available in this build.</p>
        ) : !ready ? (
          <div className="mt-6 rounded-3xl border border-hairline bg-surface p-5 text-center">
            {waited ? (
              <>
                <KeyRound size={26} className="mx-auto text-faint" />
                <p className="mt-3 font-bold text-ink">This reset link has expired or was already used.</p>
                <p className="mt-1 text-sm text-muted">Request a new one and open it on this device.</p>
                <Link to="/auth" state={{ mode: 'signin' }} className="press mt-4 inline-block text-sm font-bold text-accent">Back to sign in</Link>
              </>
            ) : (
              <div className="flex items-center justify-center gap-2 text-sm text-muted"><Spinner size={16} /> Checking your link…</div>
            )}
          </div>
        ) : (
          <form onSubmit={submit} noValidate className="mt-6 space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">New password</span>
              <div className="relative">
                <input
                  type={show ? 'text' : 'password'}
                  value={pw}
                  onChange={(e) => { setPw(e.target.value); setError(null); }}
                  autoComplete="new-password"
                  placeholder="At least 8 characters"
                  className={inputCls}
                />
                <button type="button" onClick={() => setShow((v) => !v)} aria-label={show ? 'Hide password' : 'Show password'} className="press absolute right-1.5 top-1.5 grid h-9 w-9 place-items-center rounded-xl text-faint hover:text-ink">
                  {show ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {pw && <span className="mt-1 block text-xs text-muted">Strength: {strength.label}</span>}
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-ink">Repeat it</span>
              <input
                type={show ? 'text' : 'password'}
                value={pw2}
                onChange={(e) => { setPw2(e.target.value); setError(null); }}
                autoComplete="new-password"
                className={inputCls}
              />
            </label>
            {error && <p role="alert" className="text-sm font-medium text-danger">{error}</p>}
            <Button full size="lg" type="submit" disabled={busy}>
              {busy ? <Spinner size={18} /> : <ShieldCheck size={18} />} Save new password
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
