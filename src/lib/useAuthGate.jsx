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

  return useCallback(
    (action, run) => {
      if (state.auth.status === 'authed') {
        run?.();
        return true;
      }
      navigate('/auth', {
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
