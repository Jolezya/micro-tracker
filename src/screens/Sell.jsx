import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ImagePlus, Sparkles, Wand2, X, Check, Camera, Crop,
  MapPin, Tag, Save, Eye,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { Button, Badge, Chip, Spinner } from '../components/ui/kit.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CATEGORIES, CATEGORY_MAP, CONDITIONS } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import { gradientArt } from '../lib/images.js';
import { detectCategory, suggestTitle, suggestPrice, generateDescription } from '../lib/ai.js';
import { kr } from '../lib/format.js';

const STEPS = ['Photos', 'Details', 'Preview'];

export default function Sell() {
  const navigate = useNavigate();
  const all = useAllListings();
  const { dispatch } = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [form, setForm] = useState({
    photos: [],
    title: '',
    brand: '',
    category: null,
    subcategory: null,
    condition: 'Like new',
    price: '',
    negotiable: true,
    description: '',
    location: CURRENT_USER.location.split(',')[0],
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const cat = form.category ? CATEGORY_MAP[form.category] : null;
  const tint = cat?.color || '#0f6c54';

  // AI: detect category from title
  const detected = useMemo(() => detectCategory(`${form.title} ${form.brand}`), [form.title, form.brand]);

  const priceSuggestion = useMemo(() => {
    if (!form.category) return null;
    return suggestPrice({ category: form.category, condition: form.condition, brand: form.brand, comps: all });
  }, [form.category, form.condition, form.brand, all]);

  const addPhoto = () => {
    if (form.photos.length >= 8) return;
    const seed = `sell-${Date.now()}-${form.photos.length}`;
    set({ photos: [...form.photos, gradientArt(seed, tint)] });
  };
  const removePhoto = (i) => set({ photos: form.photos.filter((_, idx) => idx !== i) });

  const enhance = () => {
    if (!form.photos.length) return;
    setEnhancing(true);
    setTimeout(() => {
      setEnhancing(false);
      toast('Photos enhanced — brighter & sharper ✨');
    }, 1400);
  };

  const applyDetectedCategory = () => {
    if (detected) set({ category: detected.category });
  };

  const genTitle = () => {
    set({ title: suggestTitle({ brand: form.brand, model: form.title, category: form.category, condition: form.condition }) });
    toast('Title suggested');
  };
  const genDescription = () => {
    set({
      description: generateDescription({
        title: form.title,
        category: form.category,
        condition: form.condition,
        brand: form.brand,
        features: cat ? [] : [],
        location: form.location,
      }),
    });
    toast('Description drafted with AI');
  };

  const canPublish = form.title && form.category && form.price && form.photos.length > 0;

  const buildListing = () => ({
    id: `l_new_${Date.now().toString(36)}`,
    title: form.title,
    category: form.category,
    subcategory: form.subcategory,
    brand: form.brand || null,
    condition: form.condition,
    price: Number(form.price) || 0,
    negotiable: form.negotiable,
    description: form.description,
    location: { city: form.location, area: form.location, lat: 59.91, lng: 10.75 },
    photos: form.photos,
    photoCount: form.photos.length,
    tags: [],
    specs: form.brand ? { Brand: form.brand, Condition: form.condition } : { Condition: form.condition },
    premium: false,
    sponsored: false,
    views: 0,
    saves: 0,
  });

  const saveDraft = () => {
    dispatch({ type: 'SAVE_DRAFT', listing: buildListing() });
    toast('Saved to drafts');
    navigate('/profile');
  };
  const publish = () => {
    const listing = buildListing();
    dispatch({ type: 'PUBLISH', listing });
    dispatch({ type: 'ADD_NOTIFICATION', notification: { type: 'system', title: 'Listing published', body: `${listing.title} is now live on Kaira` } });
    toast('Published! Your listing is live 🎉');
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="pb-28 lg:pb-8">
      {/* Header + progress */}
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="py-2.5">
          <div className="flex items-center gap-3">
            <button
              onClick={() => (step === 0 ? navigate(-1) : setStep(step - 1))}
              className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink"
            >
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-ink">Sell an item</h1>
              <p className="text-xs text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
            </div>
            <button onClick={saveDraft} className="press inline-flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 text-sm font-semibold text-muted">
              <Save size={16} /> Draft
            </button>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {STEPS.map((_, i) => (
              <div key={i} className="h-1.5 flex-1 overflow-hidden rounded-full bg-ink/10">
                <motion.div
                  className="h-full rounded-full bg-accent"
                  initial={false}
                  animate={{ width: i <= step ? '100%' : '0%' }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            ))}
          </div>
        </Container>
      </div>

      <Container className="pt-5">
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && (
              <div>
                <h2 className="text-xl font-extrabold text-ink">Add photos</h2>
                <p className="mt-1 text-sm text-muted">Great photos sell 3× faster. Add up to 8 — the first is your cover.</p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  {form.photos.map((p, i) => (
                    <div key={i} className={`relative aspect-square overflow-hidden rounded-2xl ${enhancing ? 'animate-pulse' : ''}`}>
                      <img src={p} alt="" className="h-full w-full object-cover" />
                      {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-ink/70 px-2 py-0.5 text-[10px] font-bold text-white">Cover</span>}
                      <button onClick={() => removePhoto(i)} className="press absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white">
                        <X size={13} />
                      </button>
                    </div>
                  ))}
                  {form.photos.length < 8 && (
                    <button
                      onClick={addPhoto}
                      className="press grid aspect-square place-items-center rounded-2xl border-2 border-dashed border-line/20 bg-surface text-muted"
                    >
                      <div className="flex flex-col items-center gap-1">
                        <ImagePlus size={26} />
                        <span className="text-xs font-semibold">Add</span>
                      </div>
                    </button>
                  )}
                </div>

                {form.photos.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button variant="soft" size="sm" onClick={enhance} disabled={enhancing}>
                      {enhancing ? <Spinner size={15} /> : <Sparkles size={15} />} AI enhance
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => toast('Crop applied')}>
                      <Crop size={15} /> Crop
                    </Button>
                    <Button variant="outline" size="sm" onClick={addPhoto}>
                      <Camera size={15} /> Add more
                    </Button>
                  </div>
                )}

                <div className="mt-4 flex items-start gap-2 rounded-2xl bg-accent-soft p-3 text-sm text-accent">
                  <Sparkles size={16} className="mt-0.5 shrink-0" />
                  <p>Kaira automatically enhances lighting and detects duplicates as you upload.</p>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                {/* Title */}
                <Field label="Title" hint={<AIButton onClick={genTitle} label="Suggest" />}>
                  <input
                    value={form.title}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="e.g. iPhone 15 Pro Max 256GB"
                    className="input"
                  />
                  {detected && form.category !== detected.category && (
                    <button onClick={applyDetectedCategory} className="press mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
                      <Wand2 size={13} /> AI suggests: {CATEGORY_MAP[detected.category]?.label} · tap to apply
                    </button>
                  )}
                </Field>

                {/* Brand */}
                <Field label="Brand (optional)">
                  <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="e.g. Apple" className="input" />
                </Field>

                {/* Category */}
                <Field label="Category">
                  <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
                    {CATEGORIES.map((c) => (
                      <button
                        key={c.id}
                        onClick={() => set({ category: c.id, subcategory: null })}
                        className={`press flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 ${
                          form.category === c.id ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface'
                        }`}
                      >
                        <span style={{ color: c.color }}>
                          <CategoryIcon name={c.icon} size={20} />
                        </span>
                        <span className={`text-[11px] font-semibold ${form.category === c.id ? 'text-accent' : 'text-muted'}`}>{c.label}</span>
                      </button>
                    ))}
                  </div>
                  {cat && (
                    <div className="mt-2 flex flex-wrap gap-2">
                      {cat.subcategories.map((s) => (
                        <Chip key={s} active={form.subcategory === s} onClick={() => set({ subcategory: s })}>{s}</Chip>
                      ))}
                    </div>
                  )}
                </Field>

                {/* Condition */}
                <Field label="Condition">
                  <div className="flex flex-wrap gap-2">
                    {CONDITIONS.map((c) => (
                      <Chip key={c} active={form.condition === c} onClick={() => set({ condition: c })}>{c}</Chip>
                    ))}
                  </div>
                </Field>

                {/* Price */}
                <Field label="Price">
                  <div className="flex items-center rounded-2xl border border-hairline bg-surface px-4">
                    <input
                      type="number"
                      inputMode="numeric"
                      value={form.price}
                      onChange={(e) => set({ price: e.target.value })}
                      placeholder="0"
                      className="h-14 w-full bg-transparent text-2xl font-extrabold text-ink outline-none"
                    />
                    <span className="text-xl font-bold text-faint">kr</span>
                  </div>
                  <label className="mt-2 flex items-center gap-2 text-sm text-muted">
                    <button
                      onClick={() => set({ negotiable: !form.negotiable })}
                      className={`grid h-5 w-5 place-items-center rounded border ${form.negotiable ? 'border-accent bg-accent text-accent-ink' : 'border-hairline'}`}
                    >
                      {form.negotiable && <Check size={13} />}
                    </button>
                    Price is negotiable
                  </label>
                  {priceSuggestion && (
                    <button
                      onClick={() => set({ price: String(priceSuggestion.mid) })}
                      className="press mt-3 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-3 text-left"
                    >
                      <Sparkles size={18} className="text-accent" />
                      <div className="flex-1">
                        <p className="text-sm font-bold text-accent">AI price suggestion</p>
                        <p className="text-xs text-accent/80">
                          Similar items sell for {kr(priceSuggestion.low)} – {kr(priceSuggestion.high)}
                          {priceSuggestion.basis > 0 ? ` · ${priceSuggestion.basis} comps` : ''}
                        </p>
                      </div>
                      <span className="text-sm font-extrabold text-accent">{kr(priceSuggestion.mid)}</span>
                    </button>
                  )}
                </Field>

                {/* Description */}
                <Field label="Description" hint={<AIButton onClick={genDescription} label="Generate" />}>
                  <textarea
                    rows={5}
                    value={form.description}
                    onChange={(e) => set({ description: e.target.value })}
                    placeholder="Describe your item honestly — condition, history, why you're selling…"
                    className="input resize-none py-3"
                  />
                </Field>

                {/* Location */}
                <Field label="Location">
                  <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4">
                    <MapPin size={18} className="text-faint" />
                    <input value={form.location} onChange={(e) => set({ location: e.target.value })} className="h-12 w-full bg-transparent text-ink outline-none" />
                  </div>
                </Field>
              </div>
            )}

            {step === 2 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <Eye size={18} className="text-accent" />
                  <h2 className="text-xl font-extrabold text-ink">Preview</h2>
                </div>
                <p className="mb-4 text-sm text-muted">This is exactly how buyers will see your listing.</p>

                <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
                  <div className="aspect-[4/3] w-full bg-elevated">
                    {form.photos[0] ? (
                      <img src={form.photos[0]} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-faint">No photo</div>
                    )}
                  </div>
                  <div className="p-4">
                    <div className="mb-1.5 flex flex-wrap gap-2">
                      {cat && <Badge tone="accent">{cat.label}</Badge>}
                      <Badge>{form.condition}</Badge>
                    </div>
                    <p className="text-2xl font-extrabold text-ink">{form.price ? kr(Number(form.price)) : '—'}</p>
                    <p className="mt-0.5 font-semibold text-ink">{form.title || 'Untitled'}</p>
                    <p className="mt-1 text-sm text-muted">{form.location} · just now</p>
                    {form.description && <p className="mt-3 text-[15px] leading-relaxed text-muted">{form.description}</p>}
                  </div>
                </div>

                {!canPublish && (
                  <div className="mt-4 rounded-2xl bg-warning/10 p-3 text-sm font-medium text-warning">
                    Add at least one photo, a title, category and price to publish.
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* Footer nav */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 lg:bottom-0">
        <div className="glass mx-auto flex max-w-3xl items-center gap-3 border-t px-4 py-3 pb-safe">
          {step < STEPS.length - 1 ? (
            <Button
              full
              size="lg"
              onClick={() => setStep(step + 1)}
              disabled={step === 0 && form.photos.length === 0}
            >
              Continue <ChevronRight size={18} />
            </Button>
          ) : (
            <Button full size="lg" onClick={publish} disabled={!canPublish}>
              <Tag size={18} /> Publish listing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, hint, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <label className="text-sm font-bold text-ink">{label}</label>
        {hint}
      </div>
      {children}
    </div>
  );
}

function AIButton({ onClick, label }) {
  return (
    <button onClick={onClick} className="press inline-flex items-center gap-1 rounded-full bg-accent-soft px-2.5 py-1 text-xs font-bold text-accent">
      <Sparkles size={12} /> {label}
    </button>
  );
}
