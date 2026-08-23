import React, { useMemo, useState } from 'react';
import { Search, Check, MapPin, Navigation, ChevronDown } from 'lucide-react';
import { Chip, Switch } from '../ui/kit.jsx';
import { PROVINCES, TOWNS_BY_PROVINCE, findTown } from '../../data/locations.js';
import { resolveOptions } from '../../data/filterSchema.js';
import { kwacha } from '../../lib/format.js';

// One control per filter type. All take (def, value, onChange, extra).
export function FilterControl({ def, value, onChange, values }) {
  switch (def.type) {
    case 'chips':
      return <ChipsControl def={def} value={value || []} onChange={onChange} />;
    case 'select':
      return <SelectControl def={def} value={value || []} onChange={onChange} values={values} />;
    case 'price':
    case 'range':
      return <RangeControl def={def} value={value || { min: null, max: null }} onChange={onChange} />;
    case 'toggle':
      return <ToggleControl def={def} value={!!value} onChange={onChange} />;
    case 'location':
      return <LocationControl value={value || {}} onChange={onChange} />;
    default:
      return null;
  }
}

// ---------------- Chips (single/multi) ----------------
function ChipsControl({ def, value, onChange }) {
  const multi = def.multi !== false;
  const toggle = (o) => {
    if (multi) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    else onChange(value.includes(o) ? [] : [o]);
  };
  return (
    <div className="flex flex-wrap gap-2">
      {def.options.map((o) => (
        <Chip key={o} active={value.includes(o)} onClick={() => toggle(o)}>
          {o}
        </Chip>
      ))}
    </div>
  );
}

// ---------------- Searchable select (long lists) ----------------
function SelectControl({ def, value, onChange, values }) {
  const [q, setQ] = useState('');
  const multi = def.multi !== false;
  const options = useMemo(() => resolveOptions(def, values || {}), [def, values]);

  if (def.dependsOn && options.length === 0) {
    return <p className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-faint">{def.placeholder || 'Select the previous option first'}</p>;
  }
  const needle = q.trim().toLowerCase();
  const filtered = needle ? options.filter((o) => o.toLowerCase().includes(needle)) : options;
  const toggle = (o) => {
    if (multi) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    else onChange(value.includes(o) ? [] : [o]);
  };

  return (
    <div>
      {options.length > 6 && (
        <div className="relative mb-2">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={def.placeholder || 'Search…'}
            className="focus-ring h-10 w-full rounded-xl border border-hairline bg-elevated pl-9 pr-3 text-sm text-ink placeholder:text-faint"
          />
        </div>
      )}
      <div className="thin-scrollbar max-h-56 overflow-y-auto rounded-xl border border-hairline">
        {filtered.length === 0 && <p className="px-3 py-3 text-sm text-faint">No match</p>}
        {filtered.map((o) => {
          const active = value.includes(o);
          return (
            <button
              key={o}
              onClick={() => toggle(o)}
              className={`press flex w-full items-center justify-between border-b border-hairline px-3 py-2.5 text-left text-sm last:border-0 ${
                active ? 'bg-accent-soft font-semibold text-accent' : 'text-ink hover:bg-elevated'
              }`}
            >
              {o}
              {active && <Check size={16} />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Range / Price ----------------
const STEPPER = ['Any', '1+', '2+', '3+', '4+', '5+'];
function RangeControl({ def, value, onChange }) {
  const isKwacha = def.unit === 'K';
  const set = (patch) => onChange({ ...value, ...patch });
  const num = (v) => (v === '' ? null : Number(v));

  // "min only" ranges (e.g. bedrooms) render as a quick stepper.
  if (def.onlyMin) {
    return (
      <div className="flex flex-wrap gap-2">
        {STEPPER.map((label, i) => {
          const v = i === 0 ? null : i;
          const active = (value.min ?? null) === v;
          return (
            <Chip key={label} active={active} onClick={() => set({ min: v, max: null })}>
              {label}
            </Chip>
          );
        })}
      </div>
    );
  }

  return (
    <div>
      {def.quickRanges && (
        <div className="mb-2 flex flex-wrap gap-2">
          {def.quickRanges.map((r) => {
            const active = (value.min ?? null) === (r.min ?? null) && (value.max ?? null) === (r.max ?? null);
            return (
              <Chip key={r.label} active={active} onClick={() => onChange(active ? { min: null, max: null } : { min: r.min ?? null, max: r.max ?? null })}>
                {r.label}
              </Chip>
            );
          })}
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center rounded-xl border border-hairline bg-surface px-3">
          {isKwacha && <span className="text-sm font-semibold text-faint">K</span>}
          <input
            type="number"
            inputMode="numeric"
            value={value.min ?? ''}
            onChange={(e) => set({ min: num(e.target.value) })}
            placeholder={def.min != null ? `Min ${def.min}` : 'Min'}
            className="h-11 w-full bg-transparent px-2 text-sm text-ink outline-none placeholder:text-faint"
          />
          {!isKwacha && def.unit && <span className="text-xs text-faint">{def.unit}</span>}
        </div>
        <span className="text-faint">–</span>
        <div className="flex flex-1 items-center rounded-xl border border-hairline bg-surface px-3">
          {isKwacha && <span className="text-sm font-semibold text-faint">K</span>}
          <input
            type="number"
            inputMode="numeric"
            value={value.max ?? ''}
            onChange={(e) => set({ max: num(e.target.value) })}
            placeholder={def.max != null ? `Max ${def.max}` : 'Max'}
            className="h-11 w-full bg-transparent px-2 text-sm text-ink outline-none placeholder:text-faint"
          />
          {!isKwacha && def.unit && <span className="text-xs text-faint">{def.unit}</span>}
        </div>
      </div>
    </div>
  );
}

// ---------------- Toggle ----------------
function ToggleControl({ def, value, onChange }) {
  return (
    <button
      onClick={() => onChange(!value)}
      className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3 text-left"
    >
      <span className="text-[15px] font-medium text-ink">{def.label}</span>
      <Switch checked={value} onChange={() => onChange(!value)} label={def.label} />
    </button>
  );
}

// ---------------- Location ----------------
function LocationControl({ value, onChange }) {
  const [q, setQ] = useState('');
  const set = (patch) => onChange({ ...value, ...patch });

  const towns = useMemo(() => {
    const groups = value.province
      ? TOWNS_BY_PROVINCE.filter((g) => g.province === value.province)
      : TOWNS_BY_PROVINCE;
    const needle = q.trim().toLowerCase();
    return groups
      .map((g) => ({ province: g.province, towns: g.towns.filter((t) => !needle || t.name.toLowerCase().includes(needle)) }))
      .filter((g) => g.towns.length);
  }, [value.province, q]);

  return (
    <div className="space-y-3">
      {/* Near me */}
      <button
        onClick={() => set({ nearMe: !value.nearMe })}
        className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3"
      >
        <span className="flex items-center gap-2 text-[15px] font-medium text-ink">
          <Navigation size={16} className="text-accent" /> Near me (within 25 km)
        </span>
        <Switch checked={!!value.nearMe} onChange={() => set({ nearMe: !value.nearMe })} label="Near me" />
      </button>

      {/* Province */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">Province</p>
        <div className="flex flex-wrap gap-2">
          <Chip active={!value.province} onClick={() => set({ province: null, town: null })}>
            All provinces
          </Chip>
          {PROVINCES.map((p) => (
            <Chip
              key={p.name}
              active={value.province === p.name}
              onClick={() => set({ province: value.province === p.name ? null : p.name, town: null })}
            >
              {p.name}
            </Chip>
          ))}
        </div>
      </div>

      {/* Town (searchable, filtered by province) */}
      <div>
        <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-faint">Town / city</p>
        <div className="relative mb-2">
          <MapPin size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search towns…"
            className="focus-ring h-10 w-full rounded-xl border border-hairline bg-elevated pl-9 pr-3 text-sm text-ink placeholder:text-faint"
          />
        </div>
        {value.town && (
          <button onClick={() => set({ town: null })} className="mb-2 inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            {value.town} · clear
          </button>
        )}
        <div className="thin-scrollbar max-h-48 overflow-y-auto rounded-xl border border-hairline">
          {towns.map((g) => (
            <div key={g.province}>
              {!value.province && <p className="bg-elevated px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-faint">{g.province}</p>}
              {g.towns.map((t) => (
                <button
                  key={t.name}
                  onClick={() => set({ town: t.name, province: t.province })}
                  className={`press flex w-full items-center justify-between border-b border-hairline px-3 py-2 text-left text-sm last:border-0 ${
                    value.town === t.name ? 'bg-accent-soft font-semibold text-accent' : 'text-ink hover:bg-elevated'
                  }`}
                >
                  {t.name}
                  {value.town === t.name && <Check size={15} />}
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
