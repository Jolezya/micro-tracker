// ============================================================
// Seller subscriptions — for people who sell in VOLUME.
//
// Research basis (Nov 2026): Kaira's competition in Zambia is free —
// Facebook Marketplace, WhatsApp groups, Jumia Deals, B-ne, BuySellZambia.
// Jiji does not operate here. So the FREE tier must be a complete selling
// experience, and money comes from (a) per-listing visibility and (b) pros
// who list in volume — the OLX/Avito pattern, where professional sellers
// carry most of the revenue.
//
// Price anchors: median Zambian income ≈ K2,300/month; a Premium listing
// should cost about one 1GB data bundle. Mobile-money fees run 1–4% (+~K1 on
// aggregators), so nothing is priced under K15. Prices include 16% VAT.
// ============================================================
export const VAT_RATE = 0.16;
export const PRICES_INCLUDE_VAT = true;
export const PRICING_NOTE = 'Prices in Kwacha (ZMW), including 16% VAT. Pay with MTN MoMo, Airtel Money or Zamtel Kwacha.';

export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Everything an individual seller needs',
    price: 0,
    badge: null,
    accent: '#64748b',
    limits: { listings: 10 },
    features: [
      { text: 'Up to 10 active listings', included: true },
      { text: 'Full Mahala selling experience', included: true },
      { text: 'Buyer chat & offers', included: true },
      { text: 'Pay-as-you-go Premium, Gold & Boost', included: true },
      { text: 'Basic listing stats', included: true },
      { text: 'Premium placement included', included: false },
      { text: 'Seller analytics', included: false },
      { text: 'Business profile', included: false },
    ],
  },
  {
    id: 'plus',
    name: 'Plus',
    tagline: 'For shops & side-hustles that list every week',
    price: 150,
    badge: 'Plus',
    accent: '#0f6c54',
    limits: { listings: 25 },
    popular: true,
    // 25 everyday listings at Premium pay-as-you-go would be K750 — Plus is
    // a fifth of that, which is the point: it converts anyone listing more
    // than five items a month.
    features: [
      { text: 'Up to 25 active listings', included: true },
      { text: 'Premium placement on every everyday listing', included: true },
      { text: 'Half-price Premium on vehicles, property & business', included: true },
      { text: 'Two 3-day Boosts a month included', included: true },
      { text: 'Plus badge on your profile & listings', included: true },
      { text: 'Seller analytics (views, saves, enquiries)', included: true },
      { text: 'Priority support', included: true },
      { text: 'Business profile & team seats', included: false },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    tagline: 'For car dealers, estate agents & recruiters',
    price: 950,
    badge: 'Pro seller',
    accent: '#b08d4a',
    limits: { listings: 40 },
    // 40 big-ticket listings at Premium pay-as-you-go ≈ K3,200 per 45 days
    // (≈ K2,100/month). Pro at K950 is a 55% saving: ~K24 per car per month.
    // Gumtree SA charges property agents R700–R2,000/month for the same job.
    features: [
      { text: 'Up to 40 active listings, any category', included: true },
      { text: 'Premium placement on every listing, big-ticket included', included: true },
      { text: '5 rotating Gold slots (top placement + homepage)', included: true },
      { text: 'Six 3-day Boosts a month included', included: true },
      { text: 'Business profile, logo & 3 staff seats', included: true },
      { text: 'Lead inbox & advanced analytics', included: true },
      { text: 'Bulk upload', included: true },
      { text: 'Dedicated account manager', included: false },
    ],
  },
  {
    id: 'enterprise',
    name: 'Corporate',
    tagline: 'For dealerships, developers & retailers at scale',
    price: null,
    priceLabel: "Let's talk",
    badge: 'Business',
    accent: '#4f46e5',
    limits: { listings: Infinity },
    features: [
      { text: 'Unlimited listings, users & branches', included: true },
      { text: 'Gold placement across the marketplace', included: true },
      { text: 'API & inventory-feed integration', included: true },
      { text: 'Homepage & category sponsorship', included: true },
      { text: 'Custom analytics & lead routing', included: true },
      { text: 'Invoicing & VAT receipts', included: true },
      { text: 'Dedicated account manager & SLA', included: true },
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p]));

// Badge shown on a seller depending on their subscription
export const PLAN_BADGE = {
  free: null,
  plus: { label: 'Plus', color: '#0f6c54' },
  pro: { label: 'Pro seller', color: '#b08d4a' },
  enterprise: { label: 'Business', color: '#4f46e5' },
};

// ============================================================
// Selling plans — the monetisation model.
//
// Principle: everyone can sell. Paying buys VISIBILITY, not access.
//   Mahala  → sell for free (a complete basic selling experience)
//   Premium → sell faster (more visibility)   ← recommended
//   Gold    → maximum exposure (a real step up)
//   Boost   → temporary extra exposure, separate from the plan
//   Corporate → a business platform, separate from individual plans
//
// Benefits are CATEGORY-AWARE: the architecture is shared, the wording adapts
// (see planBenefits()). Prices are one-off, per listing, in Kwacha.
// ============================================================

export const SELL_PRINCIPLE = 'Everyone can sell. Paying gives you more visibility — not basic access.';

// Two price bands. A K80 promotion on a K370,000 Hilux is 0.02% of the sale;
// the same K80 on a K1,500 phone is 5%. Big-ticket categories have fewer,
// higher-value buyers and sellers who are usually professionals — every
// classifieds business from Jiji to OLX prices them separately.
export const BIG_TICKET = new Set(['vehicles', 'motorcycles', 'boats', 'property', 'business']);
export const bandFor = (categoryId) => (BIG_TICKET.has(categoryId) ? 'bigTicket' : 'everyday');
export const BAND_LABEL = { everyday: 'Everyday items', bigTicket: 'Vehicles, property & business' };

// The price of a listing plan for a category. `price` on the plan is the
// everyday figure so existing callers keep working; big-ticket is explicit.
export function planPrice(plan, categoryId) {
  if (!plan) return 0;
  return bandFor(categoryId) === 'bigTicket' ? (plan.bigTicketPrice ?? plan.price) : plan.price;
}
export function boostPrice(boost, categoryId) {
  if (!boost) return 0;
  return bandFor(categoryId) === 'bigTicket' ? (boost.bigTicketPrice ?? boost.price) : boost.price;
}

// The three individual selling plans (Corporate is separate, below).
export const LISTING_PLANS = [
  {
    id: 'mahala',
    name: 'Mahala',
    subtitle: 'Sell for free',
    positioning: 'List your item and reach buyers.',
    // The one line a seller should read on the plan card — the reason to pick
    // this plan, separate from the longer `positioning` copy used elsewhere.
    heroBenefit: 'Everything you need to sell',
    price: 0,
    durationDays: 30,
    photoLimit: 8,
    visibility: 'Standard exposure',
    accent: '#0f6c54',
    badge: null,
    emoji: '🟢',
    flags: { premium: false, sponsored: false },
    caps: ['create', 'photos', 'normalSearch', 'messages', 'editSave', 'durationStd'],
  },
  {
    id: 'premium',
    name: 'Premium',
    subtitle: 'Sell faster',
    positioning: 'Get more visibility and sell faster.',
    heroBenefit: 'Up to 3× more views',
    // ≈ one 1GB data bundle. 2% of a K1,500 phone, 0.02% of a used Hilux.
    price: 30,
    bigTicketPrice: 80,
    durationDays: 45,
    photoLimit: 15,
    visibility: 'Boosted — up to 3× more views',
    accent: '#0f6c54',
    badge: 'Premium',
    emoji: '⭐',
    recommended: true,
    flags: { premium: true, sponsored: false },
    caps: ['higherSearch', 'premiumBadge', 'featured', 'recs', 'durationLong', 'analyticsBasic', 'canBoost', 'branding'],
  },
  {
    id: 'gold',
    name: 'Gold',
    subtitle: 'Maximum exposure',
    positioning: 'Put your listing in front of more buyers.',
    heroBenefit: 'Top placement + homepage',
    price: 75,
    bigTicketPrice: 200,
    durationDays: 60,
    photoLimit: 25,
    visibility: 'Top placement + homepage',
    accent: '#b08d4a',
    badge: 'Gold',
    emoji: '👑',
    flags: { premium: true, sponsored: true },
    caps: ['topPlacement', 'goldBadge', 'homepage', 'featuredCat', 'priorityRecs', 'promo', 'durationMax', 'analyticsAdv', 'prioritySupport'],
  },
];

// Corporate — a business platform, deliberately separate from the plans above.
export const CORPORATE = {
  id: 'corporate',
  name: 'Corporate',
  subtitle: 'Business selling platform',
  positioning: 'For dealerships, agencies, recruiters, retailers and high-volume sellers.',
  price: null,
  priceLabel: "Let's talk",
  accent: '#4f46e5',
  badge: 'Business',
  emoji: '🏢',
  flags: { premium: true, sponsored: true },
  photoLimit: 40,
  durationDays: 90,
  features: [
    'Unlimited & bulk listings (with bulk upload)',
    'Business profile & company branding',
    'Multiple staff user accounts',
    'Listing management dashboard',
    'Advanced analytics & lead management',
    'Priority exposure across the marketplace',
    'Corporate advertising & promo tools',
    'Dedicated account manager & priority support',
  ],
};

export const LISTING_PLAN_MAP = Object.fromEntries([...LISTING_PLANS, CORPORATE].map((p) => [p.id, p]));

// ---- Boost: temporary extra exposure, independent of the plan ----
// K15 floor: below that, mobile-money fees (1–4% + ~K1) eat the margin.
// The 3-day boost costs the same as a Premium listing on purpose — one clean
// mental model: "K30 buys 3 days at the very top, or 45 days higher up."
export const BOOST_OPTIONS = [
  { id: 'b24', label: '24 hours', days: 1, price: 15, bigTicketPrice: 30, blurb: 'A quick spike' },
  { id: 'b3', label: '3 days', days: 3, price: 30, bigTicketPrice: 60, blurb: 'Most popular', popular: true },
  { id: 'b7', label: '7 days', days: 7, price: 45, bigTicketPrice: 100, blurb: 'Best value' },
];
export const BOOST_MAP = Object.fromEntries(BOOST_OPTIONS.map((b) => [b.id, b]));

// Boost reaches further on higher plans.
export function boostReach(planId) {
  if (planId === 'gold') return 'Top of search, recommendations & homepage';
  if (planId === 'premium') return 'Top of search + recommendations';
  return 'Lifted to the top of search results';
}

// ============================================================
// Category-aware benefit resolver.
// Each capability renders category-appropriate wording; returns null when a
// capability is not relevant to a category (so it is automatically hidden).
// ============================================================
const CAP = {
  create: () => 'Photos, title, description, price & location',
  photos: () => 'Upload multiple photos',
  normalSearch: () => 'Appears in normal search results',
  messages: () => 'Receive buyer messages & chat',
  editSave: () => 'Edit, manage & save your listing',
  durationStd: () => 'Standard 30-day listing',
  durationLong: () => 'Longer 45-day listing',
  durationMax: () => 'Longest 60-day listing',
  higherSearch: (c) =>
    c === 'jobs' ? 'Higher position in job search' :
    c === 'property' ? 'Location-based priority in search' :
    c === 'vehicles' ? 'Higher vehicle search placement' :
    'Higher position in search results',
  topPlacement: (c) => (c === 'jobs' ? 'Top of job search results' : 'Top placement in relevant search'),
  premiumBadge: () => 'Premium badge on your listing',
  goldBadge: () => 'Gold verified badge on your listing',
  featured: (c) =>
    c === 'vehicles' ? 'Featured vehicle' :
    c === 'property' ? 'Featured property' :
    c === 'jobs' ? 'Highlighted job' :
    'Featured placement',
  featuredCat: (c) =>
    c === 'vehicles' ? 'Featured in the Vehicles hub' :
    c === 'property' ? 'Featured in the Property hub' :
    c === 'jobs' ? 'Featured in the Jobs hub' :
    'Featured category placement',
  homepage: () => 'Homepage exposure',
  recs: (c) => (c === 'jobs' ? 'Increased applicant visibility' : 'More exposure in recommendations'),
  priorityRecs: (c) => (c === 'jobs' ? 'Priority applicant visibility' : 'Priority placement in recommendations'),
  branding: (c) =>
    c === 'vehicles' ? 'Dealer promotion' :
    c === 'jobs' ? 'Employer branding' :
    c === 'property' ? 'Agency branding' :
    null, // not shown for products/electronics/fashion/etc.
  promo: () => 'Promotional / boosted exposure included',
  analyticsBasic: () => 'Basic listing analytics',
  analyticsAdv: () => 'Advanced analytics & insights',
  prioritySupport: () => 'Priority customer support',
  canBoost: () => 'Boost this listing anytime 🚀',
};

const INHERITS = { premium: 'Mahala', gold: 'Premium' };

// Returns { inherits, items:[{ text }] } — the plan's own benefits, worded for
// the given category (null category → generic product wording).
export function planBenefits(planId, categoryId = null) {
  const plan = LISTING_PLAN_MAP[planId];
  if (!plan) return { inherits: null, items: [] };
  const items = (plan.caps || [])
    .map((key) => (CAP[key] ? CAP[key](categoryId) : null))
    .filter(Boolean)
    .map((text) => ({ text }));
  return { inherits: INHERITS[planId] || null, items };
}

// A one-line "what you get" summary per plan (for compact cards).
export function planTagline(planId) {
  return { mahala: 'Sell for free', premium: 'More visibility, sell faster', gold: 'Maximum exposure' }[planId] || '';
}
