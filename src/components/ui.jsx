import React from 'react';

// Panel / card ---------------------------------------------------------------
export function Panel({ title, subtitle, right, children, className = '', bodyClass = '' }) {
  return (
    <section className={`rounded-xl border border-term-border bg-term-panel ${className}`}>
      {(title || right) && (
        <header className="flex items-center justify-between gap-3 px-4 py-3 border-b border-term-border">
          <div>
            {title && <h2 className="text-sm font-semibold tracking-wide text-term-text">{title}</h2>}
            {subtitle && <p className="text-xs text-term-muted mt-0.5">{subtitle}</p>}
          </div>
          {right}
        </header>
      )}
      <div className={`p-4 ${bodyClass}`}>{children}</div>
    </section>
  );
}

// Section label --------------------------------------------------------------
export function Eyebrow({ children, className = '' }) {
  return <div className={`text-[10px] font-semibold uppercase tracking-[0.15em] text-term-faint ${className}`}>{children}</div>;
}

// Stat tile ------------------------------------------------------------------
export function StatTile({ label, value, sub, tone = 'default', icon: Icon }) {
  const toneClass = {
    default: 'text-term-text',
    good: 'text-term-good',
    warn: 'text-term-warn',
    bad: 'text-term-bad',
    accent: 'text-term-accent'
  }[tone];
  return (
    <div className="rounded-lg border border-term-border bg-term-panel2 px-3 py-2.5">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-term-faint">
        {Icon && <Icon size={12} />}
        {label}
      </div>
      <div className={`mt-1 text-xl font-semibold tnum ${toneClass}`}>{value}</div>
      {sub && <div className="text-xs text-term-muted mt-0.5 tnum">{sub}</div>}
    </div>
  );
}

// Badge ----------------------------------------------------------------------
export function Badge({ children, color, className = '', title }) {
  const style = color ? { color, borderColor: color + '55', backgroundColor: color + '18' } : undefined;
  return (
    <span
      title={title}
      style={style}
      className={`inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium ${color ? '' : 'border-term-border text-term-muted'} ${className}`}
    >
      {children}
    </span>
  );
}

// Small horizontal meter -----------------------------------------------------
export function Meter({ value, max = 1, color = 'rgb(var(--term-accent))', height = 6, track = 'rgb(var(--term-panel2))' }) {
  const pct = Math.max(0, Math.min(1, max ? value / max : 0)) * 100;
  return (
    <div className="w-full rounded-full overflow-hidden" style={{ height, background: track }}>
      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: color, transition: 'width .4s ease' }} />
    </div>
  );
}

// Integrity score chip -------------------------------------------------------
export function IntegrityChip({ score }) {
  const tone = score >= 80 ? 'good' : score >= 50 ? 'warn' : 'bad';
  const color = { good: 'rgb(var(--term-good))', warn: 'rgb(var(--term-warn))', bad: 'rgb(var(--term-bad))' }[tone];
  return (
    <span className="inline-flex items-center gap-1.5 text-xs tnum" style={{ color }} title="Data Integrity Score (0–100)">
      <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {score}
    </span>
  );
}

// Tab bar --------------------------------------------------------------------
export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-lg border border-term-border bg-term-panel2 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
            active === t.id ? 'bg-term-panel text-term-text shadow-sm' : 'text-term-muted hover:text-term-text'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// Empty state ----------------------------------------------------------------
export function Empty({ children }) {
  return <div className="text-center text-sm text-term-muted py-8">{children}</div>;
}

// Button ---------------------------------------------------------------------
export function Button({ children, onClick, variant = 'default', size = 'md', className = '', ...rest }) {
  const variants = {
    default: 'border-term-border bg-term-panel2 hover:bg-term-panel text-term-text',
    primary: 'border-transparent bg-term-accent text-white hover:opacity-90',
    ghost: 'border-transparent hover:bg-term-panel2 text-term-muted hover:text-term-text',
    danger: 'border-term-bad/40 text-term-bad hover:bg-term-bad/10'
  };
  const sizes = { sm: 'px-2 py-1 text-xs', md: 'px-3 py-1.5 text-sm', lg: 'px-4 py-2 text-sm' };
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-lg border font-medium transition-colors ${variants[variant]} ${sizes[size]} ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}
