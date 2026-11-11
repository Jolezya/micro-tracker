import React from 'react';
import { RefreshCw } from 'lucide-react';

// One screen throwing must never blank the whole app (React unmounts the
// root on an uncaught render error, which also throws away the state update
// that was being committed). Catch it, show a way out, and let the rest of
// Kaira keep working.
export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    if (import.meta.env.DEV) console.error('Screen crashed:', error, info?.componentStack);
  }

  componentDidUpdate(prevProps) {
    // Navigating away clears the error so the next screen renders fresh.
    if (this.state.error && prevProps.resetKey !== this.props.resetKey) this.setState({ error: null });
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-extrabold text-ink">Something went wrong on this screen</p>
        <p className="mt-1 text-sm text-muted">Your data is safe on this device. Try again, or go back to Home.</p>
        <div className="mt-5 flex gap-2">
          <button
            onClick={() => this.setState({ error: null })}
            className="press inline-flex h-11 items-center gap-2 rounded-2xl bg-accent px-4 text-sm font-bold text-white"
          >
            <RefreshCw size={16} /> Try again
          </button>
          <a href="/" className="press inline-flex h-11 items-center rounded-2xl border border-hairline bg-surface px-4 text-sm font-bold text-ink">
            Home
          </a>
        </div>
      </div>
    );
  }
}
