// Subscription tiers. Prices in Zambian Kwacha (ZMW) per month.
export const PLANS = [
  {
    id: 'free',
    name: 'Free',
    tagline: 'Everything you need to get started',
    price: 0,
    badge: null,
    accent: '#64748b',
    limits: { listings: 5 },
    features: [
      { text: 'Up to 5 active listings', included: true },
      { text: 'Basic search visibility', included: true },
      { text: 'Standard support', included: true },
      { text: 'Basic listing analytics', included: true },
      { text: 'Ads displayed', included: true, note: true },
      { text: 'Higher search ranking', included: false },
      { text: 'Featured listings', included: false },
      { text: 'Premium seller badge', included: false },
    ],
  },
  {
    id: 'premium',
    name: 'KA Premium',
    tagline: 'For active sellers who want to be seen',
    price: 99,
    badge: 'Premium',
    accent: '#0f6c54',
    limits: { listings: 50 },
    popular: true,
    features: [
      { text: 'Everything in Free', included: true },
      { text: 'Up to 50 active listings', included: true },
      { text: 'Higher search ranking', included: true },
      { text: 'Advanced analytics', included: true },
      { text: 'Priority customer support', included: true },
      { text: 'Premium seller badge', included: true },
      { text: 'Featured listings', included: true },
      { text: 'Reduced ads', included: true },
    ],
  },
  {
    id: 'gold',
    name: 'KA Gold',
    tagline: 'Maximum exposure and pro seller tools',
    price: 249,
    badge: 'Gold',
    accent: '#b08d4a',
    limits: { listings: Infinity },
    features: [
      { text: 'Everything in Premium', included: true },
      { text: 'Unlimited listings', included: true },
      { text: 'Top placement in results', included: true },
      { text: 'Verified Gold badge', included: true },
      { text: 'AI pricing suggestions', included: true },
      { text: 'Listing performance analytics', included: true },
      { text: 'Profile customization & themes', included: true },
      { text: 'Advanced seller tools', included: true },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    tagline: 'For dealerships, agencies & retailers',
    price: null,
    priceLabel: "Let's talk",
    badge: 'Business',
    accent: '#4f46e5',
    limits: { listings: Infinity },
    features: [
      { text: 'Unlimited users & listings', included: true },
      { text: 'Company page & branding', included: true },
      { text: 'Employee & inventory management', included: true },
      { text: 'Analytics & lead management', included: true },
      { text: 'Bulk uploads & API access', included: true },
      { text: 'Priority support', included: true },
      { text: 'Dedicated account manager', included: true },
    ],
  },
];

export const PLAN_MAP = Object.fromEntries(PLANS.map((p) => [p.id, p]));

// Badge shown on a seller depending on their plan
export const PLAN_BADGE = {
  free: null,
  premium: { label: 'Premium', color: '#0f6c54' },
  gold: { label: 'Gold', color: '#b08d4a' },
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
    price: 35,
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
    price: 80,
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
export const BOOST_OPTIONS = [
  { id: 'b24', label: '24 hours', days: 1, price: 15, blurb: 'A quick spike' },
  { id: 'b3', label: '3 days', days: 3, price: 30, blurb: 'Most popular', popular: true },
  { id: 'b7', label: '7 days', days: 7, price: 60, blurb: 'Best value' },
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
