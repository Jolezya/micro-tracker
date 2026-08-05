import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

// Sticky, glassy screen header with optional back button and right-side actions.
export function ScreenHeader({ title, subtitle, back, right, border = true, transparent = false, children }) {
  const navigate = useNavigate();
  return (
    <header
      className={`sticky top-0 z-30 ${transparent ? '' : 'glass'} ${
        border && !transparent ? '' : 'border-0'
      } safe-top`}
    >
      <div className="mx-auto flex min-h-[56px] max-w-3xl items-center gap-3 px-4 py-2.5">
        {back && (
          <button
            onClick={() => (typeof back === 'function' ? back() : navigate(-1))}
            aria-label="Back"
            className="press -ml-1 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-ink/5 text-ink"
          >
            <ChevronLeft size={20} />
          </button>
        )}
        <div className="min-w-0 flex-1">
          {title && <h1 className="truncate text-lg font-bold tracking-tight text-ink">{title}</h1>}
          {subtitle && <p className="truncate text-xs text-muted">{subtitle}</p>}
          {children}
        </div>
        {right && <div className="flex shrink-0 items-center gap-1.5">{right}</div>}
      </div>
    </header>
  );
}

// Standard content container width.
export function Container({ children, className = '', size = 'max-w-3xl' }) {
  return <div className={`mx-auto w-full ${size} px-4 ${className}`}>{children}</div>;
}
