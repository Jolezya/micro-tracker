import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Apple, ArrowRight, Check, ShieldCheck, Zap, Heart } from 'lucide-react';
import { Logo } from '../components/layout/Logo.jsx';
import { Button, Spinner } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { useStore } from '../lib/store.jsx';
import { CURRENT_USER } from '../data/users.js';

function GoogleIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" {...props}>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.76h3.56c2.08-1.92 3.28-4.74 3.28-8.09Z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.56-2.76c-.98.66-2.23 1.06-3.72 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
    </svg>
  );
}

export default function Auth() {
  const navigate = useNavigate();
  const { dispatch } = useStore();
  const { toast } = useToast();
  const [mode, setMode] = useState('signin'); // signin | signup
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(null);

  const finish = (method) => {
    setLoading(method);
    setTimeout(() => {
      dispatch({ type: 'SIGN_IN', user: { ...CURRENT_USER, name: mode === 'signup' ? 'You' : CURRENT_USER.name } });
      toast('Welcome to Kaira 🎉');
      navigate('/');
    }, 900);
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-hidden bg-bg">
      {/* Ambient background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 -top-24 h-72 w-72 rounded-full bg-accent/25 blur-3xl" />
        <div className="absolute -right-16 top-32 h-64 w-64 rounded-full bg-gold/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-72 w-72 rounded-full bg-accent/15 blur-3xl" />
      </div>

      <div className="safe-top" />
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-6 py-10">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo size={64} />
          <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-ink">
            {mode === 'signin' ? 'Welcome back' : 'Join Kaira'}
          </h1>
          <p className="mt-2 text-muted">The premium marketplace where anything finds a new home.</p>
        </div>

        {/* Value props */}
        <div className="mb-6 flex justify-center gap-5 text-center text-xs font-medium text-muted">
          <span className="flex flex-col items-center gap-1"><ShieldCheck size={18} className="text-accent" /> Verified sellers</span>
          <span className="flex flex-col items-center gap-1"><Zap size={18} className="text-accent" /> Instant chat</span>
          <span className="flex flex-col items-center gap-1"><Heart size={18} className="text-accent" /> Your way to pay</span>
        </div>

        <div className="space-y-3">
          <Button full size="lg" variant="outline" onClick={() => finish('apple')} disabled={loading}>
            {loading === 'apple' ? <Spinner size={18} /> : <Apple size={19} fill="currentColor" />} Continue with Apple
          </Button>
          <Button full size="lg" variant="outline" onClick={() => finish('google')} disabled={loading}>
            {loading === 'google' ? <Spinner size={18} /> : <GoogleIcon />} Continue with Google
          </Button>

          <div className="flex items-center gap-3 py-1">
            <div className="h-px flex-1 bg-line/10" />
            <span className="text-xs font-medium text-faint">or with email</span>
            <div className="h-px flex-1 bg-line/10" />
          </div>

          <div className="relative">
            <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="focus-ring h-12 w-full rounded-2xl border border-hairline bg-surface pl-10 pr-3 text-[15px] text-ink placeholder:text-faint"
            />
          </div>
          <Button full size="lg" onClick={() => finish('email')} disabled={loading || !email.includes('@')}>
            {loading === 'email' ? <Spinner size={18} /> : <>Continue <ArrowRight size={18} /></>}
          </Button>
        </div>

        <button
          onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
          className="mt-6 text-center text-sm text-muted"
        >
          {mode === 'signin' ? "Don't have an account? " : 'Already have an account? '}
          <span className="font-bold text-accent">{mode === 'signin' ? 'Sign up' : 'Sign in'}</span>
        </button>

        <button onClick={() => navigate('/')} className="mt-3 text-center text-sm font-semibold text-faint">
          Continue as guest
        </button>

        <p className="mt-6 text-center text-xs text-faint">
          By continuing you agree to Kaira's Terms & Privacy Policy.
        </p>
      </div>
    </div>
  );
}
