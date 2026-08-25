import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { motion, AnimatePresence, Reorder } from 'framer-motion';
import {
  ChevronLeft, ChevronRight, ImagePlus, Sparkles, Wand2, X, Check, Camera, Crop,
  MapPin, Tag, Eye, Star, GripVertical, Phone, Pencil, Info,
} from 'lucide-react';
import { Container } from '../components/layout/Header.jsx';
import { Category3DIcon } from '../components/Category3DIcon.jsx';
import { Button, Badge, Spinner } from '../components/ui/kit.jsx';
import { Sheet } from '../components/ui/Sheet.jsx';
import { useToast } from '../components/ui/Toast.jsx';
import { CATEGORIES, CATEGORY_MAP } from '../data/categories.js';
import { CURRENT_USER } from '../data/users.js';
import { LISTING_PLANS, LISTING_PLAN_MAP } from '../data/plans.js';
import { listingSchema, visibleFields, missingRequired, photoRule } from '../data/listingSchema.js';
import { PlanBenefitList } from '../components/plan/PlanUI.jsx';
import { OptionChips } from '../components/filters/OptionChips.jsx';
import { ListingField, sanitizeNumber, clampToField } from '../components/listing/ListingField.jsx';
import { TOWNS_BY_PROVINCE, locationOf } from '../data/locations.js';
import { useStore } from '../lib/store.jsx';
import { placeholderDataUri } from '../lib/media.js';
import { readManyImages } from '../lib/imageFile.js';
import { formFromListing } from '../lib/listingForm.js';
import { VEHICLE_MAKES, VEHICLE_MAKE_NAMES } from '../data/filterSchema.js';
import { suggestPrice, generateDescription } from '../lib/ai.js';
import { kr } from '../lib/format.js';

const STEPS = ['Category', 'Plan', 'Photos', 'Details', 'Review'];
const DELIVERY_OPTIONS = ['Pickup', 'Delivery in town', 'Meet in public place', 'Courier nationwide'];
const REC_PHOTOS = 5;
// Guard rails so invalid data can't silently create a broken listing.
const TITLE_MAX = 80;
const PRICE_MAX = 1e11; // K100bn — far above any real listing, blocks absurd values
const uid = () => `p_${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
const single = (v) => (Array.isArray(v) ? v[0] : v);

export default function Sell() {
  const navigate = useNavigate();
  const { state, dispatch } = useStore();
  const { toast } = useToast();
  const { editId } = useParams();

  // The same route hydrates two cases: editing a published listing the user
  // owns (saving updates it in place) and resuming a saved draft (saving
  // publishes it). Only the user's own listings/drafts can be opened.
  const editing = useMemo(
    () => (editId ? state.myListings.find((l) => l.id === editId) || null : null),
    [editId, state.myListings]
  );
  const draft = useMemo(
    () => (editId && !editing ? state.drafts.find((d) => d.id === editId) || null : null),
    [editId, editing, state.drafts]
  );
  const source = editing || draft;
  const isEdit = !!editing;

  // Jump straight to Details when resuming — the seller already chose a
  // category and plan; they can still step back to change either.
  const [step, setStep] = useState(source ? 3 : 0);
  const [enhancing, setEnhancing] = useState(false);
  const [showTowns, setShowTowns] = useState(false);
  // Only reuse the URL id when it resolves to a listing the user owns —
  // otherwise /sell/anything would mint a new listing under that id.
  const listingId = useRef(source ? source.id : `l_new_${Date.now().toString(36)}`);
  const [form, setForm] = useState(() => (source ? formFromListing(source, CURRENT_USER.location.split(',')[0]) : {
    category: null,
    listingPlan: 'mahala',
    photos: [],
    title: '',
    description: '',
    fv: {}, // dynamic category-field values
    price: '',
    negotiable: true,
    onRequest: false,
    location: CURRENT_USER.location.split(',')[0],
    phone: '',
    delivery: ['Pickup'],
  }));

  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const setFv = (key, v) => setForm((f) => ({ ...f, fv: { ...f.fv, [key]: v } }));
  const plan = LISTING_PLAN_MAP[form.listingPlan];
  const cat = form.category ? CATEGORY_MAP[form.category] : null;
  const tint = cat?.color || '#0f6c54';
  const schema = useMemo(() => listingSchema(form.category), [form.category]);
  const isJob = form.category === 'jobs';

  const brand = single(form.fv.make) || single(form.fv.brand) || null;
  const condition = single(form.fv.condition) || null;
  // A schema field routes its value to a top-level listing key via `top`, and
  // which field does that varies by category (electronics `type`, services
  // `serviceCategory`, …). Derive it from the schema instead of assuming a
  // fixed key — otherwise required `top: 'subcategory'` fields can never be
  // satisfied and the category becomes impossible to publish.
  const subcategory = useMemo(() => {
    const f = schema.fields.find((x) => x.top === 'subcategory');
    return (f && single(form.fv[f.key])) || null;
  }, [schema, form.fv]);

  const recordCustom = (field, v) => dispatch({ type: 'RECORD_CUSTOM', field, value: v });

  const buildListing = () => {
    const attrs = {};
    let b = null, cond = null, sub = null;
    for (const f of schema.fields) {
      const raw = form.fv[f.key];
      if (raw == null || raw === '' || (Array.isArray(raw) && !raw.length)) continue;
      let v;
      if (f.type === 'number') v = Number(raw);
      else if (f.type === 'toggle') v = !!raw;
      else if (f.type === 'chips') v = f.multi === true ? (Array.isArray(raw) ? raw : [raw]) : single(raw);
      else v = single(raw);
      if (f.top === 'brand') b = v;
      else if (f.top === 'condition') cond = v;
      else if (f.top === 'subcategory') sub = v;
      else attrs[f.attr || f.key] = v;
    }
    if (form.category === 'property' && /land|plot/i.test(attrs.propertyType || '')) sub = 'Plots';
    if (Array.isArray(attrs.amenities)) {
      const a = attrs.amenities;
      attrs.parking = a.includes('Parking');
      attrs.garden = a.includes('Garden');
      attrs.pool = a.some((x) => /pool/i.test(x));
      attrs.security = a.some((x) => /security/i.test(x));
      attrs.furnished = a.includes('Furnished');
    }
    if (cond) attrs.saleCondition = cond === 'New' ? 'New' : 'Used';
    attrs.listingType = form.negotiable ? 'Negotiable' : 'For Sale';
    attrs.sellerType = 'Private seller';
    attrs.postedWithin = 'Last 24 hours';

    let price = Number(form.price) || 0;
    let priceLabel = null;
    let priceSuffix = null;
    if (form.onRequest) { price = 0; priceLabel = 'Price on request'; }
    if (isJob) { if (price) { attrs.salary = price; priceSuffix = '/mo'; } else priceLabel = priceLabel || 'Competitive'; }
    if (form.category === 'services') {
      const pm = single(form.fv.pricingModel);
      if (pm === 'Hourly rate' && price) priceSuffix = '/hr';
      if (pm === 'Quote on request') { price = 0; priceLabel = 'Quote on request'; }
    }

    return {
      id: listingId.current,
      title: form.title || 'Untitled listing',
      category: form.category,
      subcategory: sub,
      brand: b,
      condition: cond,
      price,
      negotiable: form.negotiable,
      priceLabel,
      priceSuffix,
      description: form.description,
      location: locationOf(form.location),
      photos: form.photos.map((p) => p.src),
      photoCount: form.photos.length,
      listingPlan: form.listingPlan,
      contactPhone: form.phone || null,
      delivery: form.delivery,
      tags: form.delivery,
      attrs,
      premium: plan.flags.premium,
      sponsored: plan.flags.sponsored,
      views: 0,
      saves: 0,
    };
  };

  // Auto-save a draft as the user moves through steps. Never while editing —
  // a published listing must not spawn a parallel draft of itself.
  useEffect(() => {
    if (!isEdit && form.category && (form.title || form.photos.length)) {
      dispatch({ type: 'SAVE_DRAFT', listing: { ...buildListing(), draft: true } });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  const fieldMissing = useMemo(
    () => missingRequired(schema, form.fv, { brand, condition, subcategory }),
    [schema, form.fv, brand, condition, subcategory]
  );
  // Effective photo rule for the current values (knows the subcategory once the
  // seller reaches Details — e.g. Property → Land/Plot flips to optional).
  const photo = useMemo(() => photoRule(schema, form.fv), [schema, form.fv]);
  const needPhoto = photo.level === 'required' && form.photos.length === 0;
  const reqMissing = needPhoto ? [...fieldMissing, `At least ${photo.min} photo`] : fieldMissing;
  const canReview =
    !!form.title.trim() && !needPhoto && fieldMissing.length === 0 &&
    (isJob || form.onRequest || !!form.price);

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => (step === 0 ? navigate(-1) : setStep(step - 1));

  const publish = () => {
    const listing = buildListing();
    if (isEdit) {
      dispatch({ type: 'UPDATE_LISTING', id: editing.id, patch: listing });
      toast('Changes saved');
      navigate(`/listing/${editing.id}`);
      return;
    }
    dispatch({ type: 'PUBLISH', listing });
    dispatch({ type: 'ADD_NOTIFICATION', notification: { type: 'system', title: 'Listing published', body: `${listing.title} is now live on Kaira` } });
    toast(plan.price ? `Published on ${plan.name} 🎉` : 'Published! Your listing is live 🎉');
    navigate(`/listing/${listing.id}`);
  };

  return (
    <div className="pb-dock-cta lg:pb-8">
      {/* Header + progress */}
      <div className="glass sticky top-0 z-30 safe-top">
        <Container className="py-2.5">
          <div className="flex items-center gap-3">
            <button onClick={back} className="press -ml-1 grid h-9 w-9 place-items-center rounded-full bg-ink/5 text-ink" aria-label="Back">
              <ChevronLeft size={20} />
            </button>
            <div className="flex-1">
              <h1 className="truncate text-lg font-bold text-ink">
                {isEdit ? 'Edit listing' : cat ? `List your ${cat.label.toLowerCase()}` : 'List an item'}
              </h1>
              <p className="text-xs text-muted">Step {step + 1} of {STEPS.length} · {STEPS[step]}</p>
            </div>
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-ink/5 px-2.5 py-1 text-xs font-semibold text-muted">
              {isEdit ? <><Pencil size={12} /> Editing</> : <><Check size={13} className="text-accent" /> Draft saved</>}
            </span>
          </div>
          <div className="mt-2.5 flex gap-1.5">
            {STEPS.map((label, i) => (
              <button key={label} onClick={() => i < step && setStep(i)} className="flex-1 text-left" disabled={i > step}>
                <div className="h-1.5 overflow-hidden rounded-full bg-ink/10">
                  <motion.div className="h-full rounded-full bg-accent" initial={false} animate={{ width: i <= step ? '100%' : '0%' }} transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }} />
                </div>
              </button>
            ))}
          </div>
        </Container>
      </div>

      <Container className="pt-5">
        {/* No AnimatePresence/exit here on purpose: `mode="wait"` holds the next
            step unmounted until the previous one finishes exiting, so a stalled
            animation frame (iOS in-app webviews throttle rAF, e.g. when the page
            is backgrounded mid-transition) leaves the step body blank. The enter
            animation also never starts from opacity 0 — if it never runs, the
            form is still fully visible, just un-animated. */}
        <div>
          <motion.div key={step} initial={{ y: 8 }} animate={{ y: 0 }} transition={{ duration: 0.26, ease: [0.22, 1, 0.36, 1] }}>
            {/* Only discard the category-specific answers when the category
                actually changes — they don't apply to a different schema.
                Re-picking the same category (e.g. stepping back to check) must
                not silently wipe everything the seller already filled in. */}
            {step === 0 && (
              <CategoryStep
                value={form.category}
                onSelect={(id) => { set(id === form.category ? { category: id } : { category: id, fv: {} }); setStep(1); }}
              />
            )}
            {step === 1 && <PlanStep value={form.listingPlan} onSelect={(id) => set({ listingPlan: id })} category={form.category} />}
            {step === 2 && <PhotoStep form={form} set={set} plan={plan} photo={photo} cat={cat} enhancing={enhancing} setEnhancing={setEnhancing} toast={toast} />}
            {step === 3 && (
              <DetailsStep
                form={form} set={set} setFv={setFv} schema={schema} cat={cat} isJob={isJob}
                brand={brand} condition={condition}
                openTowns={() => setShowTowns(true)} toast={toast} recordCustom={recordCustom}
              />
            )}
            {step === 4 && <ReviewStep form={form} schema={schema} plan={plan} cat={cat} brand={brand} condition={condition} goTo={setStep} isEdit={isEdit} />}
          </motion.div>
        </div>
      </Container>

      {/* Footer CTA */}
      {step > 0 && (
        <div className="dock-above fixed inset-x-0 z-40 px-3 lg:bottom-0 lg:px-0">
          <div className="glass mx-auto flex max-w-3xl items-center gap-3 border-t px-4 py-3 pb-safe">
            {step === 1 && <Button full size="lg" onClick={next}>Continue with {plan.name} <ChevronRight size={18} /></Button>}
            {step === 2 && (() => {
              const count = form.photos.length;
              // Block only when the rule is required AND unambiguous at this step.
              // Deferred rules (subcategory-dependent, e.g. property) are enforced
              // at the publish gate instead, so land sellers aren't forced here.
              const block = photo.level === 'required' && !photo.deferred && count < photo.min;
              const label = count > 0 ? 'Continue' : photo.level === 'required' ? 'Continue' : 'Continue without photos';
              return (
                <Button full size="lg" onClick={next} disabled={block}>{label} <ChevronRight size={18} /></Button>
              );
            })()}
            {step === 3 && (
              <div className="flex-1">
                {reqMissing.length > 0 && <p className="mb-1 px-1 text-center text-xs text-warning">Still needed: {reqMissing.join(', ')}</p>}
                <Button full size="lg" onClick={next} disabled={!canReview}>Review listing <ChevronRight size={18} /></Button>
              </div>
            )}
            {step === 4 && (
              <Button full size="lg" onClick={publish}>
                {isEdit ? <><Check size={18} /> Save changes</> : <><Tag size={18} /> Publish Listing</>}
              </Button>
            )}
          </div>
        </div>
      )}

      <TownPicker open={showTowns} onClose={() => setShowTowns(false)} value={form.location} onSelect={(name) => { set({ location: name }); setShowTowns(false); }} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 1 — Category                                                   */
/* ------------------------------------------------------------------ */
function CategoryStep({ value, onSelect }) {
  return (
    <div>
      <h2 className="text-2xl font-extrabold tracking-tight text-ink">What are you listing?</h2>
      <p className="mt-1 text-sm text-muted">Choose a category and Kaira will tailor the listing for you.</p>
      <div className="mt-5 grid grid-cols-1 gap-2.5 min-[360px]:grid-cols-2 sm:grid-cols-3">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            onClick={() => onSelect(c.id)}
            className={`press flex min-w-0 items-center gap-2.5 rounded-2xl border p-2 text-left transition ${
              value === c.id ? 'border-accent bg-accent-soft' : 'border-hairline bg-surface hover:bg-elevated'
            }`}
          >
            <Category3DIcon category={c} size={40} />
            <span className="min-w-0 break-words text-[15px] font-bold leading-tight text-ink">{c.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Step 2 — Plan                                                       */
/* ------------------------------------------------------------------ */
function PlanStep({ value, onSelect, category }) {
  return (
    <div>
      <h2 className="text-xl font-extrabold text-ink">How do you want to sell?</h2>
      <p className="mt-1 text-sm text-muted">Everyone can sell for free. Paying just gives your listing more visibility.</p>
      <div className="mt-4 space-y-3">
        {LISTING_PLANS.map((p) => {
          const active = value === p.id;
          return (
            <button key={p.id} onClick={() => onSelect(p.id)} className={`press relative block w-full rounded-3xl border p-4 text-left transition ${active ? 'border-transparent shadow-lift' : 'border-hairline'} bg-surface`} style={active ? { boxShadow: `0 0 0 2px ${p.accent}` } : undefined}>
              {p.recommended && <span className="absolute -top-2.5 right-4 rounded-full bg-accent px-2.5 py-0.5 text-[11px] font-bold text-accent-ink">Recommended</span>}
              <div className="flex items-start gap-3">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-2xl" style={{ background: `${p.accent}1f` }}>{p.emoji}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-extrabold text-ink">{p.name}</h3>
                    <span className="text-sm font-medium text-muted">· {p.subtitle}</span>
                  </div>
                  <div className="mt-0.5 flex items-baseline gap-1.5">
                    <span className="text-xl font-extrabold text-ink">{p.price === 0 ? 'Free' : kr(p.price)}</span>
                    {p.price > 0 && <span className="text-xs text-muted">per listing</span>}
                  </div>
                  <p className="mt-0.5 text-sm text-muted">{p.positioning}</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <Fact>{p.durationDays} days live</Fact>
                    <Fact>{p.photoLimit} photos</Fact>
                    <Fact>{p.visibility}</Fact>
                  </div>
                </div>
                <span className={`mt-1 grid h-6 w-6 shrink-0 place-items-center rounded-full border-2 ${active ? 'border-transparent text-white' : 'border-line/30'}`} style={active ? { background: p.accent } : undefined}>
                  {active && <Check size={14} strokeWidth={3} />}
                </span>
              </div>
              <AnimatePresence initial={false}>
                {active && p.id !== 'mahala' && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="mt-3 overflow-hidden border-t border-hairline pt-3">
                    <PlanBenefitList planId={p.id} category={category} />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>
      <div className="mt-3 flex items-center justify-between px-1">
        <Link to="/plans" className="press inline-flex items-center gap-1 text-sm font-bold text-accent">Compare plans <ChevronRight size={15} /></Link>
        <Link to="/plans" className="press inline-flex items-center gap-1 text-sm font-semibold text-muted">🏢 Selling as a business?</Link>
      </div>
    </div>
  );
}
function Fact({ children }) {
  return <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-medium text-muted">{children}</span>;
}

/* ------------------------------------------------------------------ */
/* Step 3 — Photos                                                     */
/* ------------------------------------------------------------------ */
function PhotoStep({ form, set, plan, photo, cat, enhancing, setEnhancing, toast }) {
  const count = form.photos.length;
  const limit = plan.photoLimit;
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const slots = photo.slots;
  const required = photo.level === 'required';
  const optional = photo.level === 'optional';

  const pickFiles = () => {
    if (count >= limit) { toast(`${plan.name} allows up to ${limit} photos`, { type: 'info' }); return; }
    fileRef.current?.click();
  };
  const onFiles = async (e) => {
    const files = e.target.files;
    if (!files?.length) return;
    setBusy(true);
    const srcs = await readManyImages(files, limit - count);
    if (srcs.length) { set({ photos: [...form.photos, ...srcs.map((src) => ({ id: uid(), src, real: true }))] }); toast(`${srcs.length} photo${srcs.length === 1 ? '' : 's'} added`); }
    else toast('Please choose image files', { type: 'error' });
    setBusy(false);
    e.target.value = '';
  };
  const addSample = () => {
    if (count >= limit) return;
    const pseudo = { id: `${form.category || 'x'}-${Date.now()}`, category: form.category, attrs: {} };
    set({ photos: [...form.photos, { id: uid(), src: placeholderDataUri(pseudo, { index: count }) }] });
  };
  const remove = (id) => set({ photos: form.photos.filter((p) => p.id !== id) });
  const makeCover = (id) => { const item = form.photos.find((p) => p.id === id); set({ photos: [item, ...form.photos.filter((p) => p.id !== id)] }); toast('Cover photo updated'); };
  const [enhanced, setEnhanced] = useState(false);
  const enhance = () => { if (!count) return; setEnhancing(true); setTimeout(() => { setEnhancing(false); setEnhanced(true); toast('Photos enhanced — brighter & sharper ✨'); }, 1300); };
  const enough = count >= 3;
  // Real check: identical sources = duplicates the seller can remove.
  const dupCount = count - new Set(form.photos.map((p) => p.src)).size;

  return (
    <div>
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-extrabold text-ink">{photo.title || 'Add photos'}</h2>
        {required
          ? <span className="text-danger" aria-label="required">*</span>
          : <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] font-semibold text-muted">{optional ? 'Optional' : 'Recommended'}</span>}
      </div>
      <p className="mt-1 text-sm text-muted">{photo.help}</p>
      {required && count === 0 && (
        <p className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-warning"><Info size={14} /> Add at least {photo.min} photo{photo.min === 1 ? '' : 's'} to publish.</p>
      )}

      {/* category-specific suggested shots */}
      {slots?.length > 0 && (
        <div className="no-scrollbar -mx-4 mt-3 flex gap-2 overflow-x-auto px-4">
          {slots.map((s, i) => (
            <span key={s} className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium ${i < count ? 'border-transparent bg-accent-soft text-accent' : 'border-hairline text-muted'}`}>
              {i < count && <Check size={12} />} {s}
            </span>
          ))}
        </div>
      )}

      <div className="mt-3 flex items-center gap-3 rounded-2xl border border-hairline bg-surface p-3">
        <div className="flex-1">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{count} of {limit >= 40 ? '∞' : limit} photos</span>
            <span className={enough ? 'text-success' : 'text-muted'}>
              {enough ? 'Looking good!' : optional ? 'Optional' : required && count === 0 ? 'Required' : `Add ${Math.max(0, 3 - count)} more`}
            </span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-ink/10">
            <div className="h-full rounded-full bg-accent transition-all" style={{ width: `${Math.min(100, (count / REC_PHOTOS) * 100)}%` }} />
          </div>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={onFiles} />

      <div className="mt-4">
        {count === 0 ? (
          <button onClick={pickFiles} className="press grid aspect-[4/3] w-full place-items-center rounded-3xl border-2 border-dashed border-line/25 bg-surface text-muted">
            <div className="flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-accent-soft text-accent">{busy ? <Spinner size={22} /> : <ImagePlus size={26} />}</span>
              <span className="font-semibold text-ink">{optional ? 'Add a photo (optional)' : 'Add your photos'}</span>
              <span className="text-xs">Choose real images from your device</span>
            </div>
          </button>
        ) : (
          <div className="no-scrollbar flex gap-3 overflow-x-auto pb-1">
            <Reorder.Group as="div" axis="x" values={form.photos} onReorder={(v) => set({ photos: v })} className="flex gap-3">
              {form.photos.map((p, i) => (
                <Reorder.Item key={p.id} value={p} className={`relative h-32 w-28 shrink-0 cursor-grab overflow-hidden rounded-2xl active:cursor-grabbing ${enhancing ? 'animate-pulse' : ''}`} whileDrag={{ scale: 1.06, zIndex: 5 }}>
                  <img src={p.src} alt="" className="pointer-events-none h-full w-full select-none object-cover" />
                  {i === 0 ? (
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-accent px-2 py-0.5 text-[10px] font-bold text-accent-ink">Cover</span>
                  ) : (
                    <button onClick={() => makeCover(p.id)} className="press absolute left-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white" aria-label="Make cover"><Star size={12} /></button>
                  )}
                  <button onClick={() => remove(p.id)} className="press absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-black/50 text-white" aria-label="Remove"><X size={13} /></button>
                  <span className="pointer-events-none absolute bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-black/45 px-1.5 py-0.5 text-[9px] font-semibold text-white"><GripVertical size={9} /> drag</span>
                </Reorder.Item>
              ))}
            </Reorder.Group>
            {count < limit && (
              <button onClick={pickFiles} className="press grid h-32 w-28 shrink-0 place-items-center rounded-2xl border-2 border-dashed border-line/25 bg-surface text-muted">
                <div className="flex flex-col items-center gap-1">{busy ? <Spinner size={20} /> : <ImagePlus size={24} />}<span className="text-xs font-semibold">Add</span></div>
              </button>
            )}
          </div>
        )}
        {count === 0 && <button onClick={addSample} className="press mt-2 text-xs font-semibold text-faint">or add a sample placeholder</button>}
      </div>

      {count > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="soft" size="sm" onClick={enhance} disabled={enhancing}>{enhancing ? <Spinner size={15} /> : <Sparkles size={15} />} Auto-enhance</Button>
          <Button variant="outline" size="sm" onClick={() => toast('Crop applied')}><Crop size={15} /> Crop</Button>
          <Button variant="outline" size="sm" onClick={pickFiles}><Camera size={15} /> Add more</Button>
        </div>
      )}

      {count > 0 && (
        <div className="mt-4 rounded-2xl border border-hairline bg-surface p-3.5">
          <div className="mb-2 flex items-center gap-2">
            <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-accent-ink"><Wand2 size={15} /></span>
            <p className="text-sm font-bold text-ink">AI photo check</p>
            <span className={`ml-auto text-xs font-semibold ${dupCount > 0 ? 'text-warning' : 'text-success'}`}>{enhancing ? 'Analysing…' : dupCount > 0 ? 'Check duplicates' : 'Looks good'}</span>
          </div>
          <ul className="space-y-1.5 text-sm">
            {enhanced ? <CheckRow ok>Lighting enhanced automatically</CheckRow> : <CheckRow tip>Tap Auto-enhance to brighten &amp; sharpen</CheckRow>}
            {dupCount > 0
              ? <CheckRow warn>{dupCount} duplicate photo{dupCount === 1 ? '' : 's'} — remove to avoid confusing buyers</CheckRow>
              : <CheckRow ok>No duplicate photos</CheckRow>}
            <CheckRow ok>Cover photo set to photo 1 — tap ★ to change</CheckRow>
            <CheckRow tip>Make sure every photo clearly shows your {cat?.label.toLowerCase() || 'item'}</CheckRow>
            {optional
              ? <CheckRow ok>Extra photos are optional for this listing</CheckRow>
              : count < 3
                ? <CheckRow warn>Add {3 - count} more angle{3 - count === 1 ? '' : 's'} to build buyer trust</CheckRow>
                : <CheckRow ok>Great range of angles</CheckRow>}
          </ul>
        </div>
      )}
    </div>
  );
}
function CheckRow({ ok, warn, tip, children }) {
  const tone = warn ? 'bg-warning/15 text-warning' : tip ? 'bg-accent-soft text-accent' : 'bg-success/15 text-success';
  return (
    <li className="flex items-center gap-2">
      <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full ${tone}`}>{warn || tip ? <Info size={12} /> : <Check size={12} strokeWidth={3} />}</span>
      <span className={warn ? 'text-warning' : 'text-muted'}>{children}</span>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Step 4 — Details (dynamic per category)                             */
/* ------------------------------------------------------------------ */
function DetailsStep({ form, set, setFv, schema, cat, isJob, brand, condition, openTowns, toast, recordCustom }) {
  const fields = visibleFields(schema, form.fv);

  const autofill = () => {
    if (!form.title.trim()) { toast('Add a title first, then AI can fill the rest', { type: 'info' }); return; }
    const patch = {};
    // detect make/model/year from the title for vehicles
    if (form.category === 'vehicles' || form.category === 'motorcycles') {
      const t = form.title;
      const make = VEHICLE_MAKE_NAMES.find((m) => new RegExp(`\\b${m}\\b`, 'i').test(t));
      const fvPatch = {};
      if (make && !form.fv.make) fvPatch.make = make;
      const model = make && (VEHICLE_MAKES[make] || []).find((md) => new RegExp(`\\b${md}\\b`, 'i').test(t));
      if (model && !form.fv.model) fvPatch.model = model;
      const yr = t.match(/\b(19|20)\d{2}\b/);
      if (yr && !form.fv.year) fvPatch.year = yr[0];
      if (Object.keys(fvPatch).length) patch.fv = { ...form.fv, ...fvPatch };
    }
    if (!form.description) patch.description = generateDescription({ title: form.title, category: form.category, condition, brand, location: form.location });
    if (!form.price && !isJob) {
      const ps = suggestPrice({ category: form.category, condition, brand, comps: [] });
      if (ps) patch.price = String(ps.mid);
    }
    set(patch);
    toast('AI filled in the details ✨');
  };

  const priceLabel = isJob ? 'Salary (per month)' : 'Price';

  return (
    <div className="space-y-5">
      <button onClick={autofill} className="press flex w-full items-center gap-3 rounded-2xl border border-accent/30 bg-gradient-to-br from-accent-soft to-transparent p-3.5 text-left">
        <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-accent text-accent-ink"><Wand2 size={20} /></span>
        <div className="flex-1">
          <p className="font-bold text-ink">Let AI fill in the details</p>
          <p className="text-xs text-muted">Reads your title to suggest attributes, description &amp; price</p>
        </div>
        <ChevronRight size={18} className="text-accent" />
      </button>

      {/* Title — helper is category-specific */}
      <Field label={isJob ? 'Job title' : 'Title'} required helper={schema.titleExample}>
        <input value={form.title} onChange={(e) => set({ title: e.target.value.slice(0, TITLE_MAX) })} maxLength={TITLE_MAX} placeholder={schema.titleExample} className="input" />
      </Field>

      {/* Dynamic category fields (progressive).
          Rendered plainly — these are required inputs, so their visibility must
          never depend on an animation frame that may never arrive. Disclosure is
          about which fields exist, not about animating them in. */}
      {fields.map((f) => (
        <Field key={f.key} label={f.label} required={f.required} helper={f.helper}>
          <ListingField field={f} value={form.fv[f.key]} onChange={(v) => setFv(f.key, v)} values={form.fv} onCustom={(v) => recordCustom(f.key, v)} />
        </Field>
      ))}

      {/* Description — helper is category-specific */}
      <Field label="Description" required helper={schema.descriptionHelp}>
        <textarea rows={5} value={form.description} onChange={(e) => set({ description: e.target.value })} placeholder={schema.descriptionHelp} className="input resize-none py-3" />
      </Field>

      {/* Price */}
      <Field label={priceLabel} required={!form.onRequest && !isJob} helper="e.g. K450,000">
        <div className="flex items-center rounded-2xl border border-hairline bg-surface px-4">
          <span className="text-xl font-bold text-faint">K</span>
          <input type="number" inputMode="decimal" min={0} max={PRICE_MAX} value={form.price} onChange={(e) => set({ price: sanitizeNumber(e.target.value) })} onBlur={(e) => set({ price: clampToField({ min: 0, max: PRICE_MAX }, sanitizeNumber(e.target.value)) })} placeholder="0" disabled={form.onRequest} className="h-14 w-full bg-transparent px-2 text-2xl font-extrabold text-ink outline-none disabled:opacity-40" />
          <span className="text-sm font-semibold text-faint">ZMW{isJob ? '/mo' : ''}</span>
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-muted">
            <button onClick={() => set({ negotiable: !form.negotiable })} className={`grid h-5 w-5 place-items-center rounded border ${form.negotiable ? 'border-accent bg-accent text-accent-ink' : 'border-hairline'}`}>{form.negotiable && <Check size={13} />}</button>
            Negotiable
          </label>
          <label className="flex items-center gap-2 text-sm text-muted">
            <button onClick={() => set({ onRequest: !form.onRequest })} className={`grid h-5 w-5 place-items-center rounded border ${form.onRequest ? 'border-accent bg-accent text-accent-ink' : 'border-hairline'}`}>{form.onRequest && <Check size={13} />}</button>
            Price on request
          </label>
        </div>
      </Field>

      {/* Location */}
      <Field label="Location" required helper="Province · Town/City">
        <button onClick={openTowns} className="press flex w-full items-center gap-2 rounded-2xl border border-hairline bg-surface px-4 py-3 text-left">
          <MapPin size={18} className="text-faint" />
          <span className="flex-1 text-ink">{form.location || 'Select a town'}</span>
          <ChevronRight size={18} className="text-faint" />
        </button>
      </Field>

      {/* Delivery (optional, common) */}
      {!isJob && form.category !== 'services' && (
        <Field label="How can buyers get it?" optional>
          <OptionChips options={DELIVERY_OPTIONS} value={form.delivery} onChange={(a) => set({ delivery: a })} multi label="option" onCustom={(v) => recordCustom('delivery', v)} />
        </Field>
      )}

      {/* Phone */}
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
/* Step 5 — Review                                                     */
/* ------------------------------------------------------------------ */
function ReviewStep({ form, schema, plan, cat, brand, condition, goTo, isEdit }) {
  const cover = form.photos[0]?.src || placeholderDataUri({ category: form.category, attrs: {}, title: form.title });
  const specs = useMemo(() => {
    return visibleFields(schema, form.fv)
      .map((f) => {
        const raw = form.fv[f.key];
        if (raw == null || raw === '' || (Array.isArray(raw) && !raw.length)) return null;
        let v;
        if (f.type === 'toggle') v = raw ? 'Yes' : 'No';
        else if (f.type === 'chips' && f.multi === true) v = (Array.isArray(raw) ? raw : [raw]).join(', ');
        else v = single(raw);
        if (f.type === 'number' && f.unit) v = `${Number(v).toLocaleString('en-ZM')} ${f.unit}`;
        return { label: f.label, value: v };
      })
      .filter(Boolean);
  }, [schema, form.fv]);

  const priceText = form.onRequest ? 'Price on request' : form.price ? kr(Number(form.price)) : '—';

  return (
    <div>
      <div className="mb-3 flex items-center gap-2"><Eye size={18} className="text-accent" /><h2 className="text-xl font-extrabold text-ink">{isEdit ? 'Review changes' : 'Review & publish'}</h2></div>
      <p className="mb-4 text-sm text-muted">Exactly how buyers will see your {cat?.label.toLowerCase()} listing.</p>

      <div className="overflow-hidden rounded-3xl border border-hairline bg-surface">
        <div className="relative aspect-[4/3] w-full bg-elevated">
          <img src={cover} alt="" className="h-full w-full object-cover" />
          {plan.badge && <span className="absolute left-3 top-3 inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white" style={{ background: plan.accent }}>{plan.emoji} {plan.badge}</span>}
          {form.photos.length > 1 && <span className="absolute bottom-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-semibold text-white">1 / {form.photos.length}</span>}
        </div>
        <div className="p-4">
          <div className="mb-1.5 flex flex-wrap gap-2">
            {cat && <Badge tone="accent">{cat.label}</Badge>}
            {condition && <Badge>{condition}</Badge>}
          </div>
          <p className="text-2xl font-extrabold text-ink">{priceText}{form.negotiable && !form.onRequest && <span className="ml-2 align-middle text-sm font-medium text-muted">Negotiable</span>}</p>
          <p className="mt-0.5 font-semibold text-ink">{form.title || 'Untitled'}</p>
          <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin size={13} /> {form.location} · just now</p>

          {(brand || specs.length > 0) && (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-2xl bg-elevated/60 p-3 text-sm">
              {brand && <Spec label="Brand" value={brand} />}
              {specs.map((s) => <Spec key={s.label} label={s.label} value={s.value} />)}
            </div>
          )}

          {form.description && <p className="mt-3 line-clamp-4 text-[15px] leading-relaxed text-muted">{form.description}</p>}
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <EditRow label="Category" value={cat?.label} onClick={() => goTo(0)} />
        <EditRow label="Photos" value={form.photos.length ? `${form.photos.length} added` : 'None added'} onClick={() => goTo(2)} />
        <EditRow label="Details" value={form.title || 'Add details'} onClick={() => goTo(3)} />
      </div>

      <div className="mt-4 flex items-center justify-between rounded-2xl border border-hairline bg-surface p-4">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-xl text-lg" style={{ background: `${plan.accent}1f` }}>{plan.emoji}</span>
          <div>
            <p className="font-bold text-ink">{plan.name} listing</p>
            <p className="text-xs text-muted">Live for {plan.durationDays} days · {plan.visibility}</p>
          </div>
        </div>
        <button onClick={() => goTo(1)} className="press inline-flex items-center gap-1 rounded-full bg-ink/5 px-3 py-1.5 text-sm font-semibold text-ink"><Pencil size={14} /> Change</button>
      </div>
    </div>
  );
}
function Spec({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-muted">{label}</span>
      <span className="truncate text-right font-semibold text-ink">{value}</span>
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
/* Shared: town picker + field wrapper                                 */
/* ------------------------------------------------------------------ */
function TownPicker({ open, onClose, value, onSelect }) {
  const [q, setQ] = useState('');
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return TOWNS_BY_PROVINCE.map((g) => ({ province: g.province, towns: g.towns.filter((t) => !needle || t.name.toLowerCase().includes(needle)) })).filter((g) => g.towns.length);
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
                <button key={t.name} onClick={() => onSelect(t.name)} className={`press flex items-center justify-between rounded-xl border px-3 py-2.5 text-left text-sm font-medium ${value === t.name ? 'border-accent bg-accent-soft text-accent' : 'border-hairline bg-surface text-ink'}`}>
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

function Field({ label, helper, required, optional, children }) {
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between px-1">
        <label className="flex items-center gap-1.5 text-sm font-bold text-ink">
          {label}
          {required && <span className="text-danger">*</span>}
          {optional && <span className="rounded-full bg-ink/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-faint">Optional</span>}
        </label>
      </div>
      {children}
      {helper && <p className="mt-1 px-1 text-xs text-faint">{helper}</p>}
    </div>
  );
}
