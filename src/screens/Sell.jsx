import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ImagePlus, Sparkles, Wand2, X, Check, Camera, Crop,
  MapPin, Tag, Eye, Star, Crown, Building2, GripVertical, Truck, Phone, Pencil, Info,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { CategoryIcon } from '../components/CategoryIcon.jsx';
import { Button, Badge, Chip, Spinner, PlanBadge } from '../components/ui/kit.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CATEGORIES, CATEGORY_MAP, CONDITIONS } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { LISTING_PLANS, LISTING_PLAN_MAP } from '../data/plans.js';
import { TOWNS_BY_PROVINCE, locationOf } from '../data/locations.js';
import { useAllListings, useStore } from '../lib/store.jsx';
import { gradientArt } from '../lib/images.js';
import { detectCategory, suggestTitle, suggestPrice, generateDescription } from '../lib/ai.js';
import { kr } from '../lib/format.js';

const STEPS = ['Plan', 'Photos', 'Details', 'Review'];
const DELIVERY_OPTIONS = ['Pickup', 'Delivery in town', 'Meet in public place', 'Courier nationwide'];
const REC_PHOTOS = 5;
const uid = () => `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

export default function Sell() {
  const navigate = useNavigate();
  const all = useAllListings();
  const { state, dispatch } = useStore();
  const { toast } = useToast();

  const [step, setStep] = useState(0);
  const [enhancing, setEnhancing] = useState(false);
  const [showTowns, setShowTowns] = useState(false);
  const listingId = useRef(`l_new_${Date.now().toString(36)}`);
  const [form, setForm] = useState({
    listingPlan: 'mahala',
    photos: [], // { id, src }
    title: '',
    brand: '',
    category: null,
    subcategory: null,
    condition: 'Like new',
    price: '',
    negotiable: true,
    description: '',
    location: CURRENT_USER.location.split(',')[0],
    phone: '',
    delivery: ['Pickup'],
  });

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const plan = LISTING_PLAN_MAP[form.listingPlan];
  const cat = form.category ? CATEGORY_MAP[form.category] : null;
  const tint = cat?.color || '#0f6c54';

  const detected = useMemo(() => detectCategory(`${form.title} ${form.brand}`), [form.title, form.brand]);
  const priceSuggestion = useMemo(() => {
    if (!form.category) return null;
    return suggestPrice({ category: form.category, condition: form.condition, brand: form.brand, comps: all });
  }, [form.category, form.condition, form.brand, all]);

  const canReview = form.title && form.category && form.price && form.photos.length > 0;

  const buildListing = () => ({
    id: listingId.current,
    title: form.title || 'Untitled listing',
    category: form.category,
    subcategory: form.subcategory,
    brand: form.brand || null,
    condition: form.condition,
    price: Number(form.price) || 0,
    negotiable: form.negotiable,
    description: form.description,
    location: locationOf(form.location),
    photos: form.photos.map((p) => p.src),
    photoCount: form.photos.length,
    tags: form.delivery,
    specs: form.brand ? { Brand: form.brand, Condition: form.condition } : { Condition: form.condition },
    listingPlan: form.listingPlan,
    contactPhone: form.phone || null,
    delivery: form.delivery,
    premium: plan.flags.premium,
    sponsored: plan.flags.sponsored,
    views: 0,
    saves: 0,
  });

  // Auto-save a draft whenever the user has entered something and moves around.
  useEffect(() => {
    if (form.title || form.photos.length) {
      dispatch({ type: 'SAVE_DRAFT', listing: { ...buildListing(), draft: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => (step === 0 ? navigate(-1) : setStep(step - 1));

  const publish = () => {
    if (form.listingPlan === 'corporate') {
      toast('Thanks! Our team will reach out about Corporate listing.', { type: 'info' });
      return;
    }
    const listing = buildListing();
    dispatch({ type: 'PUBLISH', listing });
    dispatch({
      type: 'ADD_NOTIFICATION',
      notification: { type: 'system', title: 'Listing published', body: `${listing.title} is now live on Kaira` },
    });
    toast(plan.price ? `Published on ${plan.name} 🎉` : 'Published! Your listing is live 🎉');
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="pb-28 lg:pb-8">
      {/* Header + progress */}
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={back} className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink" aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-bold text-ink">List an item</h1>
              <p className="text-xs text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-muted">
              <Check size={13} className="text-accent" /> Draft saved
            </span>
          </div>
          {/* Segmented progress with labels */}
          <div className="mt-2.5 flex gap-1.5">
            {STEPS.map((label, i) => (
              <button key={label} onClick={() => i < step && setStep(i)} className="flex-1 text-left" disabled={i > step}>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <motion.div
                    className="h-full rounded-full bg-accent"
                    initial={false}
                    animate={{ width: i <= step ? '100%' : '0%' }}
                    transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </button>
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
            transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}
          >
            {step === 0 && <PlanStep value={form.listingPlan} onSelect={(id) => set({ listingPlan: id })} />}
            {step === 1 && (
              <PhotoStep
                form={form}
                set={set}
                plan={plan}
                tint={tint}
                enhancing={enhancing}
                setEnhancing={setEnhancing}
                toast={toast}
              />
            )}
            {step === 2 && (
              <DetailsStep
                form={form}
                set={set}
                cat={cat}
                detected={detected}
                priceSuggestion={priceSuggestion}
                openTowns={() => setShowTowns(true)}
                toast={toast}
              />
            )}
            {step === 3 && <ReviewStep form={form} plan={plan} cat={cat} goTo={setStep} />}
          </motion.div>
        </AnimatePresence>
      </Container>

      {/* Footer CTA */}
      <div className="fixed inset-x-0 bottom-[68px] z-40 lg:bottom-0">
        <div className="glass mx-auto flex max-w-3xl items-center gap-3 border-t px-4 py-3 pb-safe">
          {step === 0 && (
            <Button full size="lg" onClick={next}>
              Continue with {plan.name} <ChevronRight size={18} />
            </Button>
          )}
          {step === 1 && (
            <Button full size="lg" onClick={next} disabled={form.photos.length === 0}>
              Continue <ChevronRight size={18} />
            </Button>
          )}
          {step === 2 && (
            <Button full size="lg" onClick={next} disabled={!canReview}>
              Review listing <ChevronRight size={18} />
            </Button>
          )}
          {step === 3 && (
            <Button full size="lg" onClick={publish}>
              <Tag size={18} /> {form.listingPlan === 'corporate' ? 'Request Corporate listing' : 'Publish Listing'}
            </Button>
          )}
        </div>
      </div>

      <TownPicker
        open={showTowns}
        onClose={() => setShowTowns(false)}
        value={form.location}
        onSelect={(name) => {
          set({ location: name });
          setShowTowns(false);
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Plan                                                       */
/* ------------------------------------------------------------------ */
function PlanStep({ value, onSelect }) {
  const ICONS = { mahala: Tag, premium: Sparkles, gold: Crown, corporate: Building2 };
  return (
    <div>
      <h2 className="text-xl font-extrabold text-ink">How do you want to list?</h2>
      <p className="mt-1 text-sm text-muted">Start free with Mahala, or boost your reach. You can change this before you publish.</p>
      <div className="mt-4 space-y-3">
        {LISTING_PLANS.map((p) => {
          const active = value === p.id;
          const Icon = ICONS[p.id] || Tag;
          return (
            <button
              key={p.id}
              onClick={() => onSelect(p.id)}
              className={`press relative block w-full rounded-3xl border p-4 text-left transition ${
                active ? 'border-transparent ring-2 shadow-lift' : 'border-hairline'
              } bg-surface`}
              style={active ? { '--tw-ring-color': p.accent, boxShadow: `0 0 0 2px ${p.accent}` } : undefined}
            >
              {p.recommended && (
                <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-ink">
                  Recommended
                </span>
              )}
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl" style={{ background: `${p.accent}1f`, color: p.accent }}>
                  <Icon size={22} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-ink">{p.name}</h3>
                    <span className="text-sm font-medium text-muted">· {p.subtitle}</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-ink">
                      {p.price == null ? p.priceLabel : p.price === 0 ? 'Free' : kr(p.price)}
                    </span>
                    {p.price > 0 && <span className="text-xs text-muted">per listing</span>}
                  </div>
                  {/* quick facts */}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Fact>{p.durationDays} days live</Fact>
                    <Fact>{p.photoLimit >= 40 ? 'Unlimited photos' : `${p.photoLimit} photos`}</Fact>
                    <Fact>{p.visibility}</Fact>
                  </div>
                </div>
                <span
                  className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${
                    active ? 'border-transparent text-white' : 'border-line/30'
                  }`}
                  style={active ? { background: p.accent } : undefined}
                >
                  {active && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
              {/* benefits reveal when active */}
              <AnimatePresence initial={false}>
                {active && (
                  <motion.ul
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="mt-3 grid gap-1.5 overflow-hidden border-t border-hairline pt-3"
                  >
                    {p.features.map((f) => (
                      <li key={f} className="flex items-center gap-2 text-sm text-ink">
                        <Check size={15} className="shrink-0" style={{ color: p.accent }} strokeWidth={2.6} />
                        {f}
                      </li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      <p className="mt-3 flex items-start gap-1.5 px-1 text-xs text-faint">
        <Info size={13} className="mt-0.5 shrink-0" /> Plan fees are billed to your Kaira account. Kaira never handles the payment between you and your buyer.
      </p>
    </div>
  );
}
function Fact({ children }) {
  return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-muted">{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Step 2 — Photos                                                     */
/* ------------------------------------------------------------------ */
function PhotoStep({ form, set, plan, tint, enhancing, setEnhancing, toast }) {
  const count = form.photos.length;
  const limit = plan.photoLimit;

  const addPhoto = () => {
    if (count >= limit) {
      toast(`${plan.name} allows up to ${limit} photos`, { type: 'info' });
      return;
    }
    set({ photos: [...form.photos, { id: uid(), src: gradientArt(`sell-${Date.now()}-${count}`, tint) }] });
  };
  const remove = (id) => set({ photos: form.photos.filter((p) => p.id !== id) });
  const makeCover = (id) => {
    const item = form.photos.find((p) => p.id === id);
    set({ photos: [item, ...form.photos.filter((p) => p.id !== id)] });
    toast('Cover photo updated');
  };
  const enhance = () => {
    if (!count) return;
    setEnhancing(true);
    setTimeout(() => {
      setEnhancing(false);
      toast('Photos enhanced — brighter & sharper ✨');
    }, 1300);
  };

  const enough = count >= 3;

  return (
    <div>
      <h2 className="text-xl font-extrabold text-ink">Add photos</h2>
      <p className="mt-1 text-sm text-muted">
        Add {REC_PHOTOS} or more for the best results. Drag to reorder — the first photo is your cover.
      </p>

      {/* progress hint */}
      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{count} of {limit >= 40 ? '∞' : limit} photos</span>
            <span className={enough ? 'text-success' : 'text-muted'}>{enough ? 'Looking good!' : `Add ${3 - count} more`}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (count / REC_PHOTOS) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* reorderable strip */}
      <div className="mt-4">
        {count === 0 ? (
          <button
            onClick={addPhoto}
            className="press grid aspect-[4/3] w-full place-items-center rounded-3xl border-2 border-dashed border-line/25 bg-surface text-muted"
          >
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent"><ImagePlus size={26} /></span>
              <span className="font-semibold text-ink">Add your first photo</span>
              <span className="text-xs">Tap to add</span>
            </div>
          </button>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            <Reorder.Group as="div" axis="x" values={form.photos} onReorder={(v) => set({ photos: v })} className="flex gap-3">
              {form.photos.map((p, i) => (
                <Reorder.Item
                  key={p.id}
                  value={p}
                  className={`relative h-32 w-28 shrink-0 cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing ${enhancing ? 'animate-pulse' : ''}`}
                  whileDrag={{ scale: 1.06, zIndex: 5 }}
                >
                  <img src={p.src} alt="" className="pointer-events-none h-full w-full select-none object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">Cover</span>
                  ) : (
                    <button onClick={() => makeCover(p.id)} className="press absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white" aria-label="Make cover">
                      <Star size={12} />
                    </button>
                  )}
                  <button onClick={() => remove(p.id)} className="press absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white" aria-label="Remove">
                    <X size={13} />
                  </button>
                  <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                    <GripVertical size={9} /> drag
                  </span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {count < limit && (
              <button onClick={addPhoto} className="press grid h-32 w-28 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-line/25 bg-surface text-muted">
                <div className="flex flex-col items-center gap-1">
                  <ImagePlus size={24} />
                  <span className="text-xs font-semibold">Add</span>
                </div>
              </button>
            )}
          </div>
        )}
      </div>

      {count > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="soft" size="sm" onClick={enhance} disabled={enhancing}>
            {enhancing ? <Spinner size={15} /> : <Sparkles size={15} />} Auto-enhance
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
        <p>Kaira brightens your photos automatically and checks for duplicates as you add them.</p>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 3 — Details                                                    */
/* ------------------------------------------------------------------ */
function DetailsStep({ form, set, cat, detected, priceSuggestion, openTowns, toast }) {
  const autofill = () => {
    if (!form.title.trim()) {
      toast('Add a title first, then AI can fill the rest', { type: 'info' });
      return;
    }
    const category = form.category || detected?.category || null;
    const patch = { category };
    if (category) {
      patch.description =
        form.description ||
        generateDescription({ title: form.title, category, condition: form.condition, brand: form.brand, location: form.location });
      const ps = suggestPrice({ category, condition: form.condition, brand: form.brand, comps: [] });
      if (!form.price && ps) patch.price = String(ps.mid);
    }
    set(patch);
    toast('AI filled in category, description & price ✨');
  };

  const toggleDelivery = (d) => {
    const has = form.delivery.includes(d);
    set({ delivery: has ? form.delivery.filter((x) => x !== d) : [...form.delivery, d] });
  };

  return (
    <div className="space-y-5">
      {/* AI autofill hero */}
      <button
        onClick={autofill}
        className="press flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-soft to-transparent p-3.5 text-left"
      >
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink"><Wand2 size={20} /></span>
        <div className="flex-1">
          <p className="font-bold text-ink">Let AI fill in the details</p>
          <p className="text-xs text-muted">Suggests category, description & price from what you’ve entered</p>
        </div>
        <ChevronRight size={18} className="text-accent" />
      </button>

      <Field label="Title" required hint={<AIButton onClick={() => set({ title: suggestTitle({ brand: form.brand, model: form.title, category: form.category, condition: form.condition }) })} label="Suggest" />}>
        <input value={form.title} onChange={(e) => set({ title: e.target.value })} placeholder="e.g. iPhone 15 Pro Max 256GB" className="input" />
        {detected && form.category !== detected.category && (
          <button onClick={() => set({ category: detected.category })} className="press mt-2 inline-flex items-center gap-1.5 rounded-full bg-accent-soft px-3 py-1.5 text-xs font-semibold text-accent">
            <Wand2 size={13} /> AI suggests: {CATEGORY_MAP[detected.category]?.label} · tap to apply
          </button>
        )}
      </Field>

      <Field label="Category" required>
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4">
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => set({ category: c.id, subcategory: null })}
              className={`press flex shrink-0 flex-col items-center gap-1.5 rounded-2xl border px-3 py-2.5 ${
                form.category === c.id ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface'
              }`}
            >
              <span style={{ color: c.color }}><CategoryIcon name={c.icon} size={20} /></span>
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

      <Field label="Brand" optional>
        <input value={form.brand} onChange={(e) => set({ brand: e.target.value })} placeholder="e.g. Apple" className="input" />
      </Field>

      <Field label="Condition" required>
        <div className="flex flex-wrap gap-2">
          {CONDITIONS.map((c) => (
            <Chip key={c} active={form.condition === c} onClick={() => set({ condition: c })}>{c}</Chip>
          ))}
        </div>
      </Field>

      <Field label="Price" required>
        <div className="flex items-center rounded-2xl border border-hairline bg-surface px-4">
          <span className="text-xl font-bold text-faint">K</span>
          <input type="number" inputMode="numeric" value={form.price} onChange={(e) => set({ price: e.target.value })} placeholder="0" className="h-14 w-full bg-transparent px-2 text-2xl font-extrabold text-ink outline-none" />
          <span className="text-sm font-semibold text-faint">ZMW</span>
        </div>
        <label className="mt-2 flex items-center gap-2 text-sm text-muted">
          <button onClick={() => set({ negotiable: !form.negotiable })} className={`grid h-5 w-5 place-items-center rounded border ${form.negotiable ? 'border-accent bg-accent text-accent-ink' : 'border-hairline'}`}>
            {form.negotiable && <Check size={13} />}
          </button>
          Price is negotiable
        </label>
        {priceSuggestion && (
          <button onClick={() => set({ price: String(priceSuggestion.mid) })} className="press mt-3 flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-accent-soft p-3 text-left">
            <Sparkles size={18} className="text-accent" />
            <div className="flex-1">
              <p className="text-sm font-bold text-accent">AI price suggestion</p>
              <p className="text-xs text-accent/80">Similar items sell for {kr(priceSuggestion.low)} – {kr(priceSuggestion.high)}</p>
            </div>
            <span className="text-sm font-extrabold text-accent">{kr(priceSuggestion.mid)}</span>
          </button>
        )}
      </Field>

      <Field label="Description" required hint={<AIButton onClick={() => set({ description: generateDescription({ title: form.title, category: form.category, condition: form.condition, brand: form.brand, location: form.location }) })} label="Generate" />}>
        <textarea rows={5} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder="Describe your item honestly — condition, history, why you're selling…" className="input resize-none py-3" />
      </Field>

      <Field label="Location" required>
        <button onClick={openTowns} className="press flex w-full items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-3 text-left">
          <MapPin size={18} className="text-faint" />
          <span className="flex-1 text-ink">{form.location || 'Select a town'}</span>
          <ChevronRight size={18} className="text-faint" />
        </button>
      </Field>

      <Field label="How can buyers get it?" optional>
        <div className="flex flex-wrap gap-2">
          {DELIVERY_OPTIONS.map((d) => (
            <Chip key={d} active={form.delivery.includes(d)} onClick={() => toggleDelivery(d)}>
              <span className="flex items-center gap-1.5"><Truck size={13} /> {d}</span>
            </Chip>
          ))}
        </div>
      </Field>

      <Field label="Phone number" optional>
        <div className="flex items-center gap-2 rounded-2xl border border-hairline bg-surface px-4">
          <Phone size={18} className="text-faint" />
          <input value={form.phone} onChange={(e) => set({ phone: e.target.value })} inputMode="tel" placeholder="+260 …  (buyers can also chat)" className="h-12 w-full bg-transparent text-ink outline-none" />
        </div>
      </Field>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Review                                                     */
/* ------------------------------------------------------------------ */
function ReviewStep({ form, plan, cat, goTo }) {
  const cover = form.photos[0]?.src;
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <Eye size={18} className="text-accent" />
        <h2 className="text-xl font-extrabold text-ink">Review & publish</h2>
      </div>
      <p className="mb-4 text-sm text-muted">This is exactly how buyers will see your listing.</p>

      {/* Preview card */}
      <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
        <div className="relative aspect-[4/3] w-full bg-elevated">
          {cover ? <img src={cover} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-faint">No photo</div>}
          {plan.badge && (
            <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: plan.accent }}>
              {plan.id === 'gold' ? <Crown size={11} /> : <Sparkles size={11} />} {plan.badge}
            </span>
          )}
          {form.photos.length > 1 && (
            <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">1 / {form.photos.length}</span>
          )}
        </div>
        <div className="p-4">
          <div className="mb-1.5 flex flex-wrap gap-2">
            {cat && <Badge tone="accent">{cat.label}</Badge>}
            <Badge>{form.condition}</Badge>
          </div>
          <p className="text-2xl font-extrabold text-ink">{form.price ? kr(Number(form.price)) : '—'}{form.negotiable && <span className="ml-2 align-middle text-sm font-medium text-muted">Negotiable</span>}</p>
          <p className="mt-0.5 font-semibold text-ink">{form.title || 'Untitled'}</p>
          <p className="mt-1 text-sm text-muted">{form.location} · just now</p>
          {form.description && <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-muted">{form.description}</p>}
          {form.delivery?.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              {form.delivery.map((d) => (
                <span key={d} className="rounded-full bg-ink/5 px-2.5 py-1 text-xs font-medium text-muted">{d}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit shortcuts */}
      <div className="mt-4 space-y-2">
        <EditRow label="Photos" value={`${form.photos.length} added`} onClick={() => goTo(1)} />
        <EditRow label="Details" value={form.title || 'Add details'} onClick={() => goTo(2)} />
      </div>

      {/* Plan / fee summary */}
      <div className="mt-4 rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl" style={{ background: `${plan.accent}1f`, color: plan.accent }}>
              {plan.id === 'gold' ? <Crown size={18} /> : plan.id === 'corporate' ? <Building2 size={18} /> : plan.id === 'premium' ? <Sparkles size={18} /> : <Tag size={18} />}
            </span>
            <div>
              <p className="font-bold text-ink">{plan.name} listing</p>
              <p className="text-xs text-muted">Live for {plan.durationDays} days · {plan.visibility}</p>
            </div>
          </div>
          <button onClick={() => goTo(0)} className="press inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-semibold text-ink">
            <Pencil size={14} /> Change
          </button>
        </div>
        <div className="mt-3 flex items-center justify-between border-t border-hairline pt-3">
          <span className="text-sm font-medium text-muted">Listing fee</span>
          <span className="text-lg font-extrabold text-ink">
            {plan.price == null ? plan.priceLabel : plan.price === 0 ? 'Free' : kr(plan.price)}
          </span>
        </div>
      </div>
    </div>
  );
}

function EditRow({ label, value, onClick }) {
  return (
    <button onClick={onClick} className="press flex w-full items-center gap-3 rounded-2xl border border-hairline bg-surface px-4 py-3 text-left">
      <span className="text-sm font-bold text-ink">{label}</span>
      <span className="flex-1 truncate text-sm text-muted">{value}</span>
      <span className="inline-flex items-center gap-1 text-sm font-semibold text-accent"><Pencil size={14} /> Edit</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */
function TownPicker({ open, onClose, value, onSelect }) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOWNS_BY_PROVINCE.map((g) => ({
      province: g.province,
      towns: g.towns.filter((t) => !needle || t.name.toLowerCase().includes(needle)),
    })).filter((g) => g.towns.length);
  }, [q]);
  const total = groups.reduce((a, g) => a + g.towns.length, 0);

  return (
    <Sheet open={open} onClose={onClose} title="Choose your town">
      <div className="sticky top-0 z-10 -mx-5 mb-1 px-5 pb-2">
        <div className="relative">
          <MapPin size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-faint" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search all Zambian towns…" className="focus-ring h-11 w-full rounded-2xl border border-hairline bg-elevated pl-10 pr-3 text-[15px] text-ink placeholder:text-faint" />
        </div>
        <p className="mt-1.5 px-1 text-xs text-faint">{total} towns across all 10 provinces</p>
      </div>
      <div className="pb-3">
        {groups.map((g) => (
          <div key={g.province} className="mb-3">
            <p className="sticky top-0 bg-surface px-1 py-1 text-xs font-bold uppercase tracking-wide text-faint">{g.province}</p>
            <div className="grid grid-cols-2 gap-1.5">
              {g.towns.map((t) => (
                <button
                  key={t.name}
                  onClick={() => onSelect(t.name)}
                  className={`press flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium ${
                    value === t.name ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-surface text-ink'
                  }`}
                >
                  <span className="truncate">{t.name}</span>
                  {value === t.name && <Check size={16} className="shrink-0" />}
                </button>
              ))}
            </div>
          </div>
        ))}
        {total === 0 && <p className="py-8 text-center text-sm text-muted">No town matches “{q}”.</p>}
      </div>
    </Sheet>
  );
}

function Field({ label, hint, required, optional, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <label className="flex items-center gap-1.5 text-sm font-bold text-ink">
          {label}
          {required && <span className="text-danger">*</span>}
          {optional && <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">Optional</span>}
        </label>
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
