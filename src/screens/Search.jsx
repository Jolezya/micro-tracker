import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Search as SearchIcon, SlidersHorizontal, ArrowUpDown, X, Map, LayoutGrid,
  Rows3, Bookmark, Check, MapPin,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { ListingCard, ListingRow, ListingCardSkeleton } from '../components/ListingCard.jsx';
import { MapView } from '../components/MapView.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { Button, Chip, Badge, EmptyState, Segmented } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CATEGORIES, CATEGORY_MAP, CONDITIONS } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import {
  filterListings, sortListings, SORTS, DEFAULT_FILTERS, countActiveFilters,
} from '../lib/search.js';
import { kr } from '../lib/format.js';

const VIEW_OPTIONS = [
  { value: 'grid', label: 'Grid', icon: <LayoutGrid size={15} /> },
  { value: 'list', label: 'List', icon: <Rows3 size={15} /> },
  { value: 'map', label: 'Map', icon: <Map size={15} /> },
];

export default function Search() {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const [filters, setFilters] = useState({
    ...DEFAULT_FILTERS,
    category: categoryId || null,
    q: params.get('q') || '',
  });
  const [sort, setSort] = useState('relevant');
  const [view, setView] = useState('grid');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [showSort, setShowSort] = useState(false);
  const inputRef = useRef(null);

  // React to category route changes
  useEffect(() => {
    setFilters((f) => ({ ...f, category: categoryId || null, sub: null }));
  }, [categoryId]);

  // Simulate a snappy load whenever inputs change (skeletons → premium feel)
  useEffect(() => {
    setLoading(true);
    const t = setTimeout(() => setLoading(false), 260);
    return () => clearTimeout(t);
  }, [filters, sort]);

  const results = useMemo(() => {
    const filtered = filterListings(all, filters, CURRENT_USER);
    return sortListings(filtered, sort, CURRENT_USER, filters.q);
  }, [all, filters, sort]);

  const activeCat = filters.category ? CATEGORY_MAP[filters.category] : null;
  const activeFilterCount = countActiveFilters(filters);

  const update = (patch) => setFilters((f) => ({ ...f, ...patch }));
  const clearAll = () => update({ ...DEFAULT_FILTERS, q: filters.q });

  const saveSearch = () => {
    const label =
      (filters.q || activeCat?.label || 'All listings') +
      (filters.category && filters.q ? ` in ${activeCat?.label}` : '');
    dispatch({ type: 'SAVE_SEARCH', search: { label, filters, sort } });
    toast('Search saved — we\'ll alert you on new matches');
  };

  return (
    <div>
      {/* Header with search field */}
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="py-2.5">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <SearchIcon size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
              <input
                ref={inputRef}
                value={filters.q}
                onChange={(e) => update({ q: e.target.value })}
                placeholder="Search Kaira…"
                className="focus-ring h-11 w-full rounded-2xl border border-hairline bg-surface pl-10 pr-9 text-[15px] text-ink placeholder:text-faint"
              />
              {filters.q && (
                <button
                  onClick={() => update({ q: '' })}
                  className="absolute right-2 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full bg-ink/5 text-muted"
                >
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              onClick={saveSearch}
              aria-label="Save search"
              className="press grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-hairline bg-surface text-ink"
            >
              <Bookmark size={19} />
            </button>
          </div>

          {/* Quick category chips */}
          <div className="no-scrollbar -mx-4 mt-2.5 flex gap-2 overflow-x-auto px-4">
            <Chip active={!filters.category} onClick={() => navigate('/search')}>
              All
            </Chip>
            {CATEGORIES.map((c) => (
              <Chip
                key={c.id}
                active={filters.category === c.id}
                onClick={() => navigate(`/category/${c.id}`)}
              >
                <span className="flex items-center gap-1.5">
                  <CategoryIcon name={c.icon} size={14} />
                  {c.label}
                </span>
              </Chip>
            ))}
          </div>
        </Container>
      </div>

      <Container className="pt-3">
        {/* Toolbar */}
        <div className="flex items-center gap-2">
          <p className="text-sm font-semibold text-muted">
            {loading ? 'Searching…' : `${results.length} result${results.length === 1 ? '' : 's'}`}
          </p>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setShowSort(true)}
              className="press inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
            >
              <ArrowUpDown size={15} /> Sort
            </button>
            <button
              onClick={() => setShowFilters(true)}
              className="press relative inline-flex items-center gap-1.5 rounded-xl border border-hairline bg-surface px-3 py-1.5 text-sm font-semibold text-ink"
            >
              <SlidersHorizontal size={15} /> Filters
              {activeFilterCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-accent px-1 text-[11px] font-bold text-accent-ink">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Sub-category pills */}
        {activeCat && (
          <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
            <Chip active={!filters.sub} onClick={() => update({ sub: null })}>
              All {activeCat.label}
            </Chip>
            {activeCat.subcategories.map((s) => (
              <Chip key={s} active={filters.sub === s} onClick={() => update({ sub: filters.sub === s ? null : s })}>
                {s}
              </Chip>
            ))}
          </div>
        )}

        {/* View switch */}
        <div className="mt-3">
          <Segmented options={VIEW_OPTIONS} value={view} onChange={setView} className="max-w-xs" />
        </div>

        {/* Results */}
        <div className="mt-4 pb-8">
          {loading ? (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <ListingCardSkeleton key={i} />
              ))}
            </div>
          ) : results.length === 0 ? (
            <EmptyState
              icon={SearchIcon}
              title="No matches"
              body="Try removing a filter or searching for something else."
              action={<Button variant="soft" onClick={clearAll}>Clear filters</Button>}
            />
          ) : view === 'map' ? (
            <MapView listings={results} />
          ) : view === 'list' ? (
            <div className="divide-y divide-line/10">
              {results.map((l) => (
                <ListingRow key={l.id} listing={l} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 lg:grid-cols-4">
              {results.map((l, i) => (
                <ListingCard key={l.id} listing={l} index={i} />
              ))}
            </div>
          )}
        </div>
      </Container>

      {/* Sort sheet */}
      <Sheet open={showSort} onClose={() => setShowSort(false)} title="Sort by">
        <div className="space-y-1 pb-2">
          {SORTS.map((s) => (
            <button
              key={s.value}
              onClick={() => {
                setSort(s.value);
                setShowSort(false);
              }}
              className="press flex w-full items-center justify-between rounded-xl px-3 py-3 text-left text-[15px] font-medium text-ink hover:bg-elevated"
            >
              {s.label}
              {sort === s.value && <Check size={18} className="text-accent" />}
            </button>
          ))}
        </div>
      </Sheet>

      {/* Filters sheet */}
      <FiltersSheet
        open={showFilters}
        onClose={() => setShowFilters(false)}
        filters={filters}
        update={update}
        clearAll={clearAll}
        resultCount={results.length}
      />
    </div>
  );
}

function FiltersSheet({ open, onClose, filters, update, clearAll, resultCount }) {
  const toggleCondition = (c) => {
    const has = filters.conditions.includes(c);
    update({ conditions: has ? filters.conditions.filter((x) => x !== c) : [...filters.conditions, c] });
  };
  const DISTANCES = [5, 10, 25, 50, 100];
  return (
    <Sheet
      open={open}
      onClose={onClose}
      title="Filters"
      footer={
        <div className="flex gap-3">
          <Button variant="outline" onClick={clearAll} className="flex-1">
            Clear all
          </Button>
          <Button onClick={onClose} className="flex-[2]">
            Show {resultCount} result{resultCount === 1 ? '' : 's'}
          </Button>
        </div>
      }
    >
      <div className="space-y-6 py-2">
        {/* Price */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-ink">Price range (kr)</h3>
          <div className="flex items-center gap-3">
            <input
              type="number"
              inputMode="numeric"
              placeholder="Min"
              value={filters.min ?? ''}
              onChange={(e) => update({ min: e.target.value ? Number(e.target.value) : null })}
              className="focus-ring h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-ink placeholder:text-faint"
            />
            <span className="text-faint">–</span>
            <input
              type="number"
              inputMode="numeric"
              placeholder="Max"
              value={filters.max ?? ''}
              onChange={(e) => update({ max: e.target.value ? Number(e.target.value) : null })}
              className="focus-ring h-11 w-full rounded-xl border border-hairline bg-surface px-3 text-ink placeholder:text-faint"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <h3 className="mb-2 text-sm font-bold text-ink">Condition</h3>
          <div className="flex flex-wrap gap-2">
            {CONDITIONS.map((c) => (
              <Chip key={c} active={filters.conditions.includes(c)} onClick={() => toggleCondition(c)}>
                {c}
              </Chip>
            ))}
          </div>
        </div>

        {/* Distance */}
        <div>
          <h3 className="mb-2 flex items-center gap-1.5 text-sm font-bold text-ink">
            <MapPin size={15} className="text-accent" /> Distance from {CURRENT_USER.location.split(',')[0]}
          </h3>
          <div className="flex flex-wrap gap-2">
            <Chip active={filters.maxDistance == null} onClick={() => update({ maxDistance: null })}>
              Anywhere
            </Chip>
            {DISTANCES.map((d) => (
              <Chip key={d} active={filters.maxDistance === d} onClick={() => update({ maxDistance: d })}>
                Within {d} km
              </Chip>
            ))}
          </div>
        </div>

        {/* Negotiable */}
        <button
          onClick={() => update({ negotiableOnly: !filters.negotiableOnly })}
          className="flex w-full items-center justify-between rounded-xl border border-hairline bg-surface px-4 py-3"
        >
          <span className="text-[15px] font-medium text-ink">Price negotiable only</span>
          <span
            className={`grid h-6 w-6 place-items-center rounded-md border ${
              filters.negotiableOnly ? 'border-accent bg-accent text-accent-ink' : 'border-hairline'
            }`}
          >
            {filters.negotiableOnly && <Check size={14} />}
          </span>
        </button>
      </div>
    </Sheet>
  );
}
