import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  Search as SearchIcon, SlidersHorizontal, ArrowUpDown, X, Map, LayoutGrid,
  Rows3, Bookmark, Check, ChevronRight, Sparkles,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { ListingCard, ListingRow, ListingCardSkeleton } from '../components/ListingCard.jsx';
import { MapView } from '../components/MapView.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { Button, Chip, EmptyState, Segmented } from '../components/ui/kit.jsx';
import { FilterControl } from '../components/filters/FilterControls.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { schemaFor, quickFilters, hydrateSchema, resolveOptions } from '../data/filterSchema.js';
import { runNaturalSearch } from '../lib/nlSearch.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import {
  matchesText, filterBySchema, sortListings, SORTS,
  countActiveSchema, activeFilterList, isFilterActive, formatFilterValue, getField,
} from '../lib/search.js';

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid size={15} /> },
  { value: 'list', label: 'List', icon: <Rows3 size={15} /> },
  { value: 'map', label: 'Map', icon: <Map size={15} /> },
];
const ORIGIN = CURRENT_USER;
const EMPTY = {}; // stable reference for "no filters"

export default function Search() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const search = state.search;
  const catKey = categoryId || 'all';
  const activeCat = categoryId ? CATEGORY_MAP[categoryId] : null;

  const [sub, setSub] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [quickKey, setQuickKey] = useState(null); // open a single quick filter
  const [showSort, setShowSort] = useState(false);

  // committed filter values for this category (stable ref to avoid render thrash)
  const values = useMemo(() => search.filters[catKey] || EMPTY, [search.filters, catKey]);

  // one-time seed of the query from ?q=
  useEffect(() => {
    const q = params.get('q');
    if (q && q !== search.q) dispatch({ type: 'PATCH_SEARCH', patch: { q } });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => setSub(null), [categoryId]);

  // Base listings = category + subcategory + text query (schema filters applied after)
  const base = useMemo(() => {
    return all.filter((l) => {
      if (categoryId && l.category !== categoryId) return false;
      if (sub && l.subcategory !== sub) return false;
      if (!matchesText(l, search.q)) return false;
      return true;
    });
  }, [all, categoryId, sub, search.q]);

  const schema = useMemo(() => hydrateSchema(schemaFor(categoryId, sub), base), [categoryId, sub, base]);

  const results = useMemo(() => {
    const filtered = filterBySchema(base, schema, values, ORIGIN);
    return sortListings(filtered, search.sort, ORIGIN, search.q);
  }, [base, schema, values, search.sort, search.q]);

  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 240);
    return () => clearTimeout(t);
  }, [values, search.sort, search.q, categoryId, sub]);

  const activeCount = countActiveSchema(schema, values);
  const activeList = activeFilterList(schema, values);
  const quicks = quickFilters(schema);

  const commit = (next) => dispatch({ type: 'SET_CATEGORY_FILTERS', category: catKey, values: next });
  const setValue = (key, v) => commit({ ...values, [key]: v });
  const removeFilter = (key) => {
    const next = { ...values };
    delete next[key];
    commit(next);
  };
  const clearAll = () => commit({});

  const setSearchQ = (q) => dispatch({ type: 'PATCH_SEARCH', patch: { q } });
  const askAI = () => {
    const text = (search.q || '').trim();
    if (!text) return;
    const res = runNaturalSearch(text, dispatch, navigate);
    if (res.summary) toast(`AI found: ${res.summary}`, { type: 'info' });
  };
  const setSort = (sort) => dispatch({ type: 'PATCH_SEARCH', patch: { sort } });
  const setView = (view) => dispatch({ type: 'PATCH_SEARCH', patch: { view } });

  const saveSearch = () => {
    const label = (search.q || activeCat?.label || 'All listings') + (activeCount ? ` · ${activeCount} filters` : '');
    dispatch({ type: 'SAVE_SEARCH', search: { label, category: catKey } });
    toast("Search saved — we'll alert you on new matches");
  };

  const quickDef = quicks.find((q) => q.key === quickKey);

  return (
    <div>
      {/* Header */}
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="py-2.5">
          <div className="flex items-center gap-2">
            <form onSubmit={(e) => { e.preventDefault(); askAI(); }} className="relative flex-1">
              <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                value={search.q}
                onChange={(e) => setSearchQ(e.target.value)}
                placeholder="Search or ask in your own words…"
                className="focus-ring h-11 w-full rounded-2xl border border-hairline bg-surface pl-10 pr-20 text-[15px] text-ink placeholder:text-faint"
              />
              {search.q && (
                <button type="button" onClick={() => setSearchQ('')} className="absolute right-16 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-muted">
                  <X size={15} />
                </button>
              )}
              <button type="submit" aria-label="Ask AI" className="press absolute right-1.5 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 rounded-xl btn-accent px-2.5 py-1.5 text-xs font-bold">
                <Sparkles size={13} /> AI
              </button>
            </form>
            <button onClick={saveSearch} aria-label="Save search" className="press grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-hairline bg-surface text-ink">
              <Bookmark size={19} />
            </button>
          </div>

          {/* Category chips */}
          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
            <Chip active={!categoryId} onClick={() => navigate('/search')}>All</Chip>
            {CATEGORIES.map((c) => (
              <Chip key={c.id} active={categoryId === c.id} onClick={() => navigate(`/category/${c.id}`)}>
                <span className="flex items-center gap-1.5"><CategoryIcon name={c.icon} size={14} /> {c.label}</span>
              </Chip>
            ))}
          </div>
        </Container>
      </div>

      <Container className="pt-3">
        {/* Subcategory pills */}
        {activeCat && (
          <div className="no-scrollbar -mx-4 mb-2 flex gap-2 overflow-x-auto px-4">
            <Chip active={!sub} onClick={() => setSub(null)}>All {activeCat.label}</Chip>
            {activeCat.subcategories.map((s) => (
              <Chip key={s} active={sub === s} onClick={() => setSub(sub === s ? null : s)}>{s}</Chip>
            ))}
          </div>
        )}

        {/* Quick filters + Filters button */}
        <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 py-0.5">
          <button
            onClick={() => setShowFilters(true)}
            className="press relative inline-flex shrink-0 items-center gap-1.5 rounded-full bg-ink px-3.5 py-2 text-sm font-semibold text-bg"
          >
            <SlidersHorizontal size={15} /> Filters{activeCount > 0 ? ` (${activeCount})` : ''}
          </button>
          {quicks.map((def) => {
            const active = isFilterActive(def, values[def.key]);
            return (
              <button
                key={def.key}
                onClick={() => setQuickKey(def.key)}
                className={`press inline-flex shrink-0 items-center gap-1 rounded-full border px-3.5 py-2 text-sm font-medium transition ${
                  active ? 'border-transparent bg-accent-soft text-accent' : 'border-hairline bg-surface text-muted'
                }`}
              >
                {active ? formatFilterValue(def, values[def.key]) : def.label}
                <ChevronRight size={14} className="rotate-90 opacity-60" />
              </button>
            );
          })}
        </div>

        {/* Active filter chips */}
        {activeList.length > 0 && (
          <div className="no-scrollbar -mx-4 mt-2 flex items-center gap-2 overflow-x-auto px-4">
            {activeList.map(({ def, text }) => (
              <button
                key={def.key}
                onClick={() => removeFilter(def.key)}
                className="press inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1.5 text-xs font-semibold text-accent-ink"
              >
                <span className="opacity-80">{def.label}:</span> {text}
                <X size={13} />
              </button>
            ))}
            <button onClick={clearAll} className="press shrink-0 rounded-full px-2 py-1.5 text-xs font-bold text-danger">
              Clear all
            </button>
          </div>
        )}

        {/* Toolbar */}
        <div className="mt-3 flex items-center gap-2">
          <p className="text-sm font-semibold text-muted">
            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
          <button onClick={() => setShowSort(true)} className="ml-auto press inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm font-semibold text-ink">
            <ArrowUpDown size={15} /> {SORTS.find((s) => s.value === search.sort)?.label.replace('Price: ', '') || 'Sort'}
          </button>
        </div>

        {/* View switch */}
        <div className="mt-3">
          <Segmented options={VIEW_OPTIONS} value={search.view} onChange={setView} className="max-w-xs" />
        </div>

        {/* Results */}
        <div className="mt-4 pb-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => <ListingCardSkeleton key={i} />)}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No matches"
              body={activeCount ? 'No listings match all your filters. Try removing one.' : 'Try a different search.'}
              action={activeCount ? <Button variant="soft" onClick={clearAll}>Clear filters</Button> : null}
            />
          ) : search.view === 'map' ? (
            <MapView listings={results} />
          ) : search.view === 'list' ? (
            <div className="divide-y divide-line/10">{results.map((l) => <ListingRow key={l.id} listing={l} />)}</div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((l, i) => <ListingCard key={l.id} listing={l} index={i} />)}
            </div>
          )}
        </div>
      </Container>

      {/* Sort sheet */}
      <Sheet open={showSort} onClose={() => setShowSort(false)} title="Sort by">
        <div className="space-y-1 pb-2">
          {SORTS.map((s) => (
            <button key={s.value} onClick={() => { setSort(s.value); setShowSort(false); }} className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink hover:bg-elevated">
              {s.label}
              {search.sort === s.value && <Check size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Full filter sheet */}
      <FilterSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        schema={schema}
        base={base}
        committed={values}
        origin={ORIGIN}
        onApply={commit}
        title={activeCat ? `Filter ${activeCat.label}` : 'Filters'}
      />

      {/* Single quick filter sheet */}
      <QuickFilterSheet
        def={quickDef}
        open={!!quickDef}
        onClose={() => setQuickKey(null)}
        schema={schema}
        base={base}
        committed={values}
        origin={ORIGIN}
        onApply={(key, v) => { setValue(key, v); setQuickKey(null); }}
        onClear={(key) => { removeFilter(key); setQuickKey(null); }}
      />
    </div>
  );
}

/* ---------------- Full filter sheet ---------------- */
function FilterSheet({ open, onClose, schema, base, committed, origin, onApply, title }) {
  const [pending, setPending] = useState(committed);
  useEffect(() => { if (open) setPending(committed); }, [open]); // reseed on open

  const count = useMemo(() => filterBySchema(base, schema, pending, origin).length, [base, schema, pending, origin]);
  const active = countActiveSchema(schema, pending);
  const setV = (key, v) => setPending((p) => ({ ...p, [key]: v }));

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={title}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => setPending({})} className="flex-1">Clear all</Button>
          <Button onClick={() => { onApply(pending); onClose(); }} className="flex-[2]">
            Show {count} result{count === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {active > 0 && (
          <p className="text-xs font-semibold text-accent">{active} filter{active === 1 ? '' : 's'} applied</p>
        )}
        {schema.filters.map((def) => (
          <div key={def.key}>
            <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
              {def.label}
              {isFilterActive(def, pending[def.key]) && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
            </h3>
            <FilterControl def={def} value={pending[def.key]} onChange={(v) => setV(def.key, v)} values={pending} />
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* ---------------- Single quick filter sheet ---------------- */
function QuickFilterSheet({ def, open, onClose, schema, base, committed, origin, onApply, onClear }) {
  const [pending, setPending] = useState(committed[def?.key]);
  useEffect(() => { if (open && def) setPending(committed[def.key]); }, [open, def?.key]); // eslint-disable-line

  const count = useMemo(() => {
    if (!def) return 0;
    return filterBySchema(base, schema, { ...committed, [def.key]: pending }, origin).length;
  }, [def, base, schema, committed, pending, origin]);

  if (!def) return null;
  const active = isFilterActive(def, pending);

  return (
    <Sheet
      open={open}
      onClose={onClose}
      title={def.label}
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onClear(def.key)} className="flex-1">Clear</Button>
          <Button onClick={() => onApply(def.key, pending)} className="flex-[2]" disabled={!active && !isFilterActive(def, committed[def.key])}>
            Show {count} result{count === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      <div className="py-2">
        <FilterControl def={def} value={pending} onChange={setPending} values={committed} />
      </div>
    </Sheet>
  );
}
