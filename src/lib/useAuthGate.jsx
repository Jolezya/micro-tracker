import { useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useStore } from './store.jsx';

// Progressive gating: guests browse everything, and an account is only asked
// for at the moment they act. The reason travels with them so the sign-up
// screen can explain itself, and returnTo brings them back to exactly where
// they were once the account exists.
//
//   const requireAuth = useAuthGate();
//   onClick={() => requireAuth('save', () => dispatch({ type: 'TOGGLE_SAVE', id }))}
//
// Returns true when the action ran, false when the user was sent to sign up.
export function useAuthGate() {
  const { state } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  // opts.replace — for screens that gate on MOUNT rather than on a tap (Sell).
  // Those must replace the history entry instead of pushing onto it: otherwise
  // the gated screen stays in history, going back re-mounts it, the gate fires
  // again and you are bounced straight to /auth — a back button that looks
  // broken. Action gates (save, message) push as normal, so back returns to
  // the listing you were reading.
  return useCallback(
    (action, run, opts = {}) => {
      if (state.auth.status === 'authed') {
        run?.();
        return true;
      }
      navigate('/auth', {
        replace: !!opts.replace,
        state: { reason: action, returnTo: location.pathname + location.search + location.hash },
      });
      return false;
    },
    [state.auth.status, navigate, location]
  );
}

export function useIsAuthed() {
  const { state } = useStore();
  return state.auth.status === 'authed';
}
