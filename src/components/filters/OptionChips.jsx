import React, { useState } from 'react';
import { Plus, X, Check, Sparkles } from 'lucide-react';
import { Chip } from '../ui/kit.jsx';
import { closestOption } from '../../lib/ai.js';

// Reusable option picker with the UNIVERSAL custom-value rule:
//   options + "Other / Not listed?" → type a value → saved & shown like any other.
// Works single- or multi-select. Custom values are stored as plain strings in
// the same value array, so they never break the data structure.
export function OptionChips({
  options = [],
  value = [],
  onChange,
  multi = true,
  allowCustom = true,
  label = 'value',
  onCustom, // (customValue) => void  — lets callers learn the master list
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState('');
  const [suggest, setSuggest] = useState(null); // { typed, suggestion }

  const customSelected = value.filter((v) => !options.includes(v));

  const toggle = (o) => {
    if (multi) onChange(value.includes(o) ? value.filter((x) => x !== o) : [...value, o]);
    else onChange(value.includes(o) ? [] : [o]);
  };
  const add = (v) => {
    if (multi) { if (!value.includes(v)) onChange([...value, v]); }
    else onChange([v]);
  };
  const removeVal = (v) => onChange(value.filter((x) => x !== v));

  const reset = () => { setText(''); setSuggest(null); if (!multi) setOpen(false); };

  const submit = () => {
    const val = text.trim();
    if (!val) return;
    const exact = options.find((o) => o.toLowerCase() === val.toLowerCase());
    if (exact) { add(exact); reset(); return; }
    const near = closestOption(val, options);
    if (near && !near.exact) { setSuggest({ typed: val, suggestion: near.match }); return; }
    add(val); onCustom?.(val); reset();
  };
  const acceptSuggestion = () => { add(suggest.suggestion); reset(); };
  const keepTyped = () => { add(suggest.typed); onCustom?.(suggest.typed); reset(); };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <Chip key={o} active={value.includes(o)} onClick={() => toggle(o)}>{o}</Chip>
        ))}

        {/* custom selected values render like normal chips (removable) */}
        {customSelected.map((v) => (
          <button
            key={v}
            onClick={() => removeVal(v)}
            className="press inline-flex items-center gap-1 rounded-full border border-accent bg-accent-soft px-3 py-2 text-sm font-medium text-accent"
          >
            {v}
            <X size={13} />
          </button>
        ))}

        {allowCustom && (
          <button
            onClick={() => setOpen((o) => !o)}
            className={`press inline-flex items-center gap-1 rounded-full border border-dashed px-3.5 py-2 text-sm font-medium transition ${
              open ? 'border-accent text-accent' : 'border-line/40 text-muted hover:text-ink'
            }`}
          >
            <Plus size={14} /> Other / Not listed?
          </button>
        )}
      </div>

      {allowCustom && open && (
        <div className="mt-2 rounded-2xl border border-hairline bg-elevated p-2.5">
          <p className="mb-1.5 px-1 text-xs font-semibold text-muted">Enter {label} manually</p>
          <div className="flex items-center gap-2">
            <input
              autoFocus
              value={text}
              onChange={(e) => { setText(e.target.value); setSuggest(null); }}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); submit(); } }}
              placeholder={`Type ${label}…`}
              className="focus-ring h-10 w-full rounded-xl border border-hairline bg-surface px-3 text-sm text-ink placeholder:text-faint"
            />
            <button onClick={submit} disabled={!text.trim()} className="press shrink-0 rounded-xl btn-accent px-3.5 py-2 text-sm font-bold disabled:opacity-40">
              Add
            </button>
          </div>

          {suggest && (
            <div className="mt-2 flex flex-wrap items-center gap-2 rounded-xl bg-accent-soft px-3 py-2 text-sm">
              <Sparkles size={14} className="text-accent" />
              <span className="text-accent">Did you mean <b>{suggest.suggestion}</b>?</span>
              <div className="ml-auto flex gap-1.5">
                <button onClick={acceptSuggestion} className="press inline-flex items-center gap-1 rounded-full btn-accent px-2.5 py-1 text-xs font-bold">
                  <Check size={12} /> Use {suggest.suggestion}
                </button>
                <button onClick={keepTyped} className="press rounded-full border border-hairline bg-surface px-2.5 py-1 text-xs font-semibold text-ink">
                  Keep “{suggest.typed}”
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
