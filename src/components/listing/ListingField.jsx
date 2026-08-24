import React, { useMemo, useState } from 'react';
import { Search, Check, Plus, Sparkles } from 'lucide-react';
import { OptionChips } from '../filters/OptionChips.jsx';
import { closestOption } from '../../lib/ai.js';

// Renders one listing field by type. `values` is the full field-value map (for
// dependent options). `onCustom(value)` records custom entries for the master list.
export function ListingField({ field, value, onChange, values, onCustom }) {
  switch (field.type) {
    case 'chips':
      return (
        <OptionChips
          options={field.options || []}
          value={Array.isArray(value) ? value : value ? [value] : []}
          onChange={onChange}
          multi={field.multi === true}
          allowCustom={field.allowCustom !== false}
          label={field.label.toLowerCase()}
          onCustom={onCustom}
        />
      );
    case 'select':
      return <SelectOne field={field} value={value || ''} onChange={onChange} values={values} onCustom={onCustom} />;
    case 'number':
      return <NumberInput field={field} value={value} onChange={onChange} />;
    case 'text':
      return (
        <input
          value={value ?? ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder || ''}
          className="input"
        />
      );
    case 'toggle':
      return (
        <div className="inline-flex rounded-full bg-ink/5 p-1">
          {[['No', false], ['Yes', true]].map(([lbl, val]) => (
            <button
              key={lbl}
              onClick={() => onChange(val)}
              className={`press rounded-full px-5 py-1.5 text-sm font-semibold transition ${
                !!value === val ? 'bg-surface text-ink shadow-soft' : 'text-muted'
              }`}
            >
              {lbl}
            </button>
          ))}
        </div>
      );
    default:
      return null;
  }
}

// Quantities are never negative and never in exponent form. Strip anything that
// isn't a plain number as it's typed, then clamp to the field's range on blur —
// clamping while typing would fight the user (typing "19" for 1998 would jump).
export const sanitizeNumber = (s) =>
  String(s ?? '').replace(/[^\d.]/g, '').replace(/(\.[^.]*)\./g, '$1');

export function clampToField(field, raw) {
  if (raw === '' || raw == null) return '';
  const n = Number(raw);
  if (!Number.isFinite(n)) return '';
  let v = n;
  if (field?.min != null && v < field.min) v = field.min;
  if (field?.max != null && v > field.max) v = field.max;
  return String(v);
}

function NumberInput({ field, value, onChange }) {
  return (
    <div className="flex items-center rounded-2xl border border-hairline bg-surface px-4">
      <input
        type="number"
        inputMode="decimal"
        min={field.min ?? 0}
        max={field.max}
        value={value ?? ''}
        onChange={(e) => onChange(sanitizeNumber(e.target.value))}
        onBlur={(e) => {
          const clamped = clampToField(field, sanitizeNumber(e.target.value));
          if (clamped !== String(value ?? '')) onChange(clamped);
        }}
        placeholder={field.placeholder || '0'}
        className="h-12 w-full bg-transparent text-ink outline-none placeholder:text-faint"
      />
      {field.unit && <span className="pl-2 text-sm font-semibold text-faint">{field.unit}</span>}
    </div>
  );
}

// ---------------- Searchable single-select with custom value ----------------
function SelectOne({ field, value, onChange, values, onCustom }) {
  const [q, setQ] = useState('');
  const options = useMemo(
    () => (field.optionsFrom ? field.optionsFrom(values) || [] : field.options || []),
    [field, values]
  );

  if (field.dependsOn && options.length === 0) {
    return <p className="rounded-xl bg-ink/5 px-3 py-2.5 text-sm text-faint">{field.placeholder || 'Select the previous option first'}</p>;
  }

  const needle = q.trim().toLowerCase();
  const filtered = needle ? options.filter((o) => o.toLowerCase().includes(needle)) : options;
  const isCustom = value && !options.includes(value);
  const exactExists = needle && options.some((o) => o.toLowerCase() === needle);
  const near = field.allowCustom !== false && needle && !exactExists ? closestOption(q.trim(), options) : null;

  const pick = (o) => { onChange(o); setQ(''); };
  const addCustom = () => {
    const val = q.trim();
    if (!val) return;
    onChange(val);
    onCustom?.(val);
    setQ('');
  };

  return (
    <div>
      {/* selected value pill */}
      {value && (
        <button onClick={() => onChange('')} className="press mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-semibold text-accent">
          <Check size={14} /> {value}{isCustom && <span className="text-[11px] font-medium opacity-70"> · custom</span>} <span className="ml-1 text-faint">✕</span>
        </button>
      )}

      <div className="relative mb-2">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter' && field.allowCustom !== false && !exactExists) { e.preventDefault(); addCustom(); } }}
          placeholder={field.placeholder || 'Search or type your own…'}
          className="focus-ring h-11 w-full rounded-2xl border border-hairline bg-surface pl-9 pr-3 text-[15px] text-ink placeholder:text-faint"
        />
      </div>

      {near && !near.exact && (
        <button onClick={() => pick(near.match)} className="press mb-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
          <Sparkles size={12} /> Did you mean {near.match}?
        </button>
      )}

      {(needle || field.optionsFrom) && (
        <div className="thin-scrollbar max-h-52 overflow-y-auto rounded-xl border border-hairline">
          {field.allowCustom !== false && needle && !exactExists && (
            <button onClick={addCustom} className="press flex w-full items-center gap-2 border-b border-hairline px-3 py-2.5 text-left text-sm font-semibold text-accent last:border-0 hover:bg-elevated">
              <Plus size={15} /> Add “{q.trim()}”
            </button>
          )}
          {filtered.map((o) => (
            <button
              key={o}
              onClick={() => pick(o)}
              className={`press flex w-full items-center justify-between border-b border-hairline px-3 py-2.5 text-left text-sm last:border-0 ${
                value === o ? 'bg-accent-soft font-semibold text-accent' : 'text-ink hover:bg-elevated'
              }`}
            >
              {o}
              {value === o && <Check size={16} />}
            </button>
          ))}
          {filtered.length === 0 && !needle && <p className="px-3 py-3 text-sm text-faint">Type to search…</p>}
        </div>
      )}
    </div>
  );
}
