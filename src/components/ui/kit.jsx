import React from 'react';
import { motion } from 'framer-motion';
import { BadgeCheck, Star, Crown, ShieldCheck } from 'lucide-react';
import { initials } from '../../lib/format.js';
import { PLAN_BADGE } from '../../data/plans.js';

// ---------------- Button ----------------
const VARIANTS = {
  accent: 'btn-accent shadow-soft hover:brightness-105',
  solid: 'bg-ink text-bg hover:opacity-90',
  soft: 'bg-accent-soft text-accent hover:brightness-95',
  outline: 'border border-hairline bg-surface text-ink hover:bg-elevated',
  ghost: 'text-ink hover:bg-ink/5',
  danger: 'bg-danger/10 text-danger hover:bg-danger/15',
  glass: 'glass text-ink',
};
const SIZES = {
  sm: 'h-9 px-3.5 text-sm rounded-xl gap-1.5',
  md: 'h-11 px-5 text-[15px] rounded-2xl gap-2',
  lg: 'h-13 px-6 text-base rounded-2xl gap-2 py-3.5',
  icon: 'h-10 w-10 rounded-full',
};

export function Button({
  as: Comp = 'button',
  variant = 'accent',
  size = 'md',
  className = '',
  children,
  full,
  ...props
}) {
  return (
    <Comp
      className={`press focus-ring inline-flex items-center justify-center font-semibold transition ${
        VARIANTS[variant]
      } ${SIZES[size]} ${full ? 'w-full' : ''} ${className}`}
      {...props}
    >
      {children}
    </Comp>
  );
}

export function IconButton({ className = '', children, label, ...props }) {
  return (
    <button
      aria-label={label}
      className={`press focus-ring grid h-10 w-10 place-items-center rounded-full transition ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------- Badge / Chip ----------------
export function Badge({ children, tone = 'default', className = '', icon: Icon }) {
  const tones = {
    default: 'bg-ink/5 text-muted',
    accent: 'bg-accent-soft text-accent',
    gold: 'bg-gold/15 text-gold',
    danger: 'bg-danger/12 text-danger',
    success: 'bg-success/12 text-success',
    dark: 'bg-ink text-bg',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${tones[tone]} ${className}`}
    >
      {Icon && <Icon size={12} strokeWidth={2.5} />}
      {children}
    </span>
  );
}

export function Chip({ active, children, className = '', ...props }) {
  return (
    <button
      className={`press focus-ring whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
        active
          ? 'border-transparent bg-ink text-bg'
          : 'border-hairline bg-surface text-muted hover:text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}

// ---------------- Avatar ----------------
const AVATAR_COLORS = [
  ['#0f6c54', '#0a4d3c'],
  ['#4f46e5', '#3730a3'],
  ['#db2777', '#9d174d'],
  ['#d97706', '#92400e'],
  ['#0891b2', '#155e75'],
  ['#7c3aed', '#5b21b6'],
];
export function Avatar({ name, size = 40, className = '', ring }) {
  const idx = (name || '?').charCodeAt(0) % AVATAR_COLORS.length;
  const [a, b] = AVATAR_COLORS[idx];
  const fontSize = Math.round(size * 0.38);
  return (
    <span
      className={`inline-grid shrink-0 place-items-center rounded-full font-bold text-white ${
        ring ? 'ring-2 ring-bg' : ''
      } ${className}`}
      style={{
        width: size,
        height: size,
        fontSize,
        background: `linear-gradient(135deg, ${a}, ${b})`,
      }}
    >
      {initials(name)}
    </span>
  );
}

// ---------------- Verified / Plan badges ----------------
export function VerifiedBadge({ size = 16 }) {
  return <BadgeCheck size={size} className="text-accent" strokeWidth={2.4} fill="currentColor" style={{ color: 'rgb(var(--accent))' }} />;
}

export function PlanBadge({ plan, className = '' }) {
  const b = PLAN_BADGE[plan];
  if (!b) return null;
  const Icon = plan === 'gold' ? Crown : plan === 'enterprise' ? ShieldCheck : BadgeCheck;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${className}`}
      style={{ color: b.color, background: `${b.color}1f` }}
    >
      <Icon size={11} strokeWidth={2.6} />
      {b.label}
    </span>
  );
}

export function Stars({ rating = 0, size = 13, showValue = true }) {
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={size} className="text-gold" fill="currentColor" style={{ color: 'rgb(var(--gold))' }} />
      {showValue && <span className="text-sm font-semibold text-ink">{rating.toFixed(1)}</span>}
    </span>
  );
}

// ---------------- Skeleton ----------------
export function Skeleton({ className = '' }) {
  return <div className={`skeleton rounded-xl ${className}`} />;
}

// ---------------- Segmented control ----------------
export function Segmented({ options, value, onChange, className = '' }) {
  return (
    <div className={`relative flex rounded-full bg-ink/5 p-1 ${className}`}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            onClick={() => onChange(o.value)}
            className="relative flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition"
          >
            {active && (
              <motion.span
                layoutId={`seg-${className}`}
                className="absolute inset-0 rounded-full bg-surface shadow-soft"
                transition={{ type: 'spring', stiffness: 500, damping: 40 }}
              />
            )}
            <span className={`relative z-10 flex items-center justify-center gap-1.5 ${active ? 'text-ink' : 'text-muted'}`}>
              {o.icon}
              {o.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ---------------- Switch ----------------
export function Switch({ checked, onChange, label }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`focus-ring relative h-7 w-12 shrink-0 rounded-full transition-colors ${
        checked ? 'bg-accent' : 'bg-ink/15'
      }`}
    >
      <motion.span
        layout
        transition={{ type: 'spring', stiffness: 600, damping: 34 }}
        className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow"
        style={{ left: checked ? 22 : 2 }}
      />
    </button>
  );
}

// ---------------- Misc ----------------
export function Divider({ className = '' }) {
  return <div className={`h-px w-full bg-line/10 ${className}`} />;
}

export function Spinner({ size = 20, className = '' }) {
  return (
    <span
      className={`inline-block animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
      style={{ width: size, height: size }}
    />
  );
}

export function EmptyState({ icon: Icon, title, body, action }) {
  return (
    <div className="flex flex-col items-center justify-center px-8 py-16 text-center">
      {Icon && (
        <span className="mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-accent-soft text-accent">
          <Icon size={28} strokeWidth={1.8} />
        </span>
      )}
      <h3 className="text-lg font-bold text-ink">{title}</h3>
      {body && <p className="mt-1 max-w-xs text-sm text-muted">{body}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function SectionHeader({ title, action, onAction }) {
  return (
    <div className="mb-3 flex items-end justify-between px-1">
      <h2 className="text-lg font-bold tracking-tight text-ink">{title}</h2>
      {action && (
        <button onClick={onAction} className="press text-sm font-semibold text-accent">
          {action}
        </button>
      )}
    </div>
  );
}
