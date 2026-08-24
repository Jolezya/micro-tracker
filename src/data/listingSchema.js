// ============================================================
// Kaira category-driven LISTING schema.
//
// "Tell Kaira what you're selling → Kaira builds the right form for you."
//
// Each category defines: a title example, description helper, suggested photo
// slots, and an ordered list of fields with types, options, helper text,
// progressive-disclosure rules, and where each value is stored. The Sell flow
// renders these dynamically; buildListing() maps them to structured `attrs`
// that the SAME keys drive search & filtering (see data/filterSchema.js).
//
// Field def:
//   { key, label, type, options|optionsFrom, dependsOn, multi, required,
//     helper, unit, placeholder, showIf(values), allowCustom, top, attr }
//   type: 'chips' | 'select' | 'number' | 'toggle' | 'text'
//   top:  store to a top-level listing key (e.g. 'brand') instead of attrs
//   attr: attrs key (defaults to `key`)
// ============================================================

import { CONDITIONS } from './categories.js';
import {
  VEHICLE_TYPES, FUEL_TYPES, BODY_TYPES, VEHICLE_MAKES, VEHICLE_MAKE_NAMES,
  PROPERTY_TYPES, ELECTRONICS_TYPES, ELECTRONICS_BRANDS,
  JOB_CATEGORIES, JOB_TYPES, WORK_MODES, EXPERIENCE_LEVELS, EDUCATION_LEVELS,
} from './filterSchema.js';

const TRANSMISSIONS = ['Automatic', 'Manual', 'Semi-automatic', 'Other'];
const PROPERTY_BUILD_TYPES = ['House', 'Apartment', 'Townhouse', 'Office', 'Commercial', 'Land / Plot'];
const LAND_USE = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed use'];
const PROPERTY_AMENITIES = ['Parking', 'Security wall/fence', 'Swimming pool', 'Garden', 'Borehole', 'Backup power', 'Air conditioning', 'Balcony', 'Staff quarters', 'Furnished'];
const PROPERTY_STATUS = ['New', 'Existing', 'Newly renovated'];
const STORAGE = ['16GB', '32GB', '64GB', '128GB', '256GB', '512GB', '1TB', '2TB'];
const RAM = ['2GB', '3GB', '4GB', '6GB', '8GB', '12GB', '16GB', '32GB'];
const OS = ['Android', 'iOS', 'Windows', 'macOS', 'HarmonyOS', 'Other'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'One size'];
const GENDERS = ['Men', 'Women', 'Unisex', 'Kids'];
const COLOURS = ['Black', 'White', 'Grey', 'Silver', 'Blue', 'Red', 'Green', 'Brown', 'Beige', 'Gold', 'Multi'];
const MATERIALS = ['Cotton', 'Leather', 'Denim', 'Wool', 'Polyester', 'Silk', 'Linen', 'Synthetic'];
const SERVICE_PRICING = ['Hourly rate', 'Fixed price', 'Quote on request'];
const INDUSTRIES = ['Technology', 'Finance', 'Mining', 'Retail', 'Healthcare', 'Education', 'Government', 'NGO', 'Agriculture', 'Construction', 'Hospitality', 'Other'];

// chips store an array, select/text store a string — normalise to one value.
const one = (v) => (Array.isArray(v) ? v[0] : v) || '';

const isLand = (v) => /land|plot/i.test(one(v.propertyType));

// ---------------- Vehicles ----------------
const VEHICLES = {
  titleExample: 'e.g. Toyota Corolla 2022',
  descriptionHelp: 'Mention service history, number of owners, condition and key features.',
  photoSlots: ['Front', 'Rear', 'Side', 'Interior', 'Dashboard', 'Engine', 'Wheels', 'Additional'],
  fields: [
    { key: 'vehicleType', label: 'Vehicle type', type: 'chips', options: VEHICLE_TYPES, required: true },
    { key: 'make', label: 'Make / brand', type: 'select', options: VEHICLE_MAKE_NAMES, top: 'brand', required: true, placeholder: 'Search or type a brand…', helper: 'Not listed? Just type it in.' },
    { key: 'model', label: 'Model', type: 'select', dependsOn: 'make', placeholder: 'Select a make first…', optionsFrom: (v) => VEHICLE_MAKES[one(v.make)] || [], helper: 'Model not listed? Type it manually.' },
    { key: 'year', label: 'Year', type: 'number', min: 1980, max: 2026, helper: 'e.g. 2022' },
    { key: 'mileage', label: 'Mileage', type: 'number', unit: 'km', helper: 'e.g. 85,000 km' },
    { key: 'fuel', label: 'Fuel / power', type: 'chips', options: FUEL_TYPES },
    { key: 'transmission', label: 'Transmission', type: 'chips', options: TRANSMISSIONS },
    { key: 'bodyType', label: 'Body type', type: 'chips', options: BODY_TYPES, showIf: (v) => one(v.vehicleType) !== 'Motorcycle' },
    { key: 'condition', label: 'Condition', type: 'chips', options: CONDITIONS, top: 'condition', required: true },
  ],
};

// ---------------- Property ----------------
const PROPERTY = {
  titleExample: 'e.g. 3-Bedroom House in Lusaka',
  descriptionHelp: 'Mention bedrooms, bathrooms, location, amenities and the property condition.',
  photoSlots: ['Exterior', 'Living areas', 'Bedrooms', 'Bathrooms', 'Kitchen', 'Garden/yard', 'Additional'],
  fields: [
    { key: 'propertyType', label: 'Property type', type: 'chips', options: PROPERTY_BUILD_TYPES, required: true },
    { key: 'listingKind', label: 'For sale or rent', type: 'chips', options: ['For Sale', 'For Rent'], multi: false, required: true, allowCustom: false },
    // building fields — hidden for land/plots
    { key: 'bedrooms', label: 'Bedrooms', type: 'number', helper: 'e.g. 3', showIf: (v) => !isLand(v) },
    { key: 'bathrooms', label: 'Bathrooms', type: 'number', helper: 'e.g. 2', showIf: (v) => !isLand(v) },
    { key: 'buildingSize', label: 'Building size', type: 'number', unit: 'm²', helper: 'e.g. 220 m²', showIf: (v) => !isLand(v) },
    { key: 'status', label: 'Status', type: 'chips', options: PROPERTY_STATUS, showIf: (v) => !isLand(v) },
    { key: 'amenities', label: 'Amenities', type: 'chips', options: PROPERTY_AMENITIES, multi: true, showIf: (v) => !isLand(v), helper: 'Select all that apply — or add your own.' },
    // land fields — only for land/plots (no "condition")
    { key: 'landUse', label: 'Land use', type: 'chips', options: LAND_USE, showIf: isLand, required: true },
    { key: 'plotSize', label: 'Plot size', type: 'number', unit: 'm²', helper: 'e.g. 2,000 m²', showIf: isLand },
    { key: 'titleDeed', label: 'Title deed available', type: 'toggle' },
    { key: 'serviced', label: 'Serviced', type: 'toggle', showIf: isLand },
    { key: 'roadAccess', label: 'Road access', type: 'toggle', showIf: isLand },
    { key: 'electricity', label: 'Electricity (ZESCO)', type: 'toggle' },
    { key: 'water', label: 'Water', type: 'toggle' },
  ],
};

// ---------------- Electronics ----------------
const ELECTRONICS = {
  titleExample: 'e.g. iPhone 15 Pro Max 256GB',
  descriptionHelp: 'Mention condition, full specifications, accessories included and any warranty.',
  photoSlots: ['Front', 'Back', 'Screen on', 'Accessories', 'Packaging', 'Serial / model'],
  fields: [
    { key: 'type', label: 'Product type', type: 'chips', options: ELECTRONICS_TYPES, top: 'subcategory', required: true },
    { key: 'brand', label: 'Brand', type: 'select', options: ELECTRONICS_BRANDS, top: 'brand', required: true, placeholder: 'Search or type a brand…' },
    { key: 'model', label: 'Model', type: 'text', helper: 'e.g. Galaxy S24 Ultra' },
    { key: 'storage', label: 'Storage', type: 'chips', options: STORAGE, showIf: (v) => matchType(v, ['Phones', 'Computers', 'Gaming']) },
    { key: 'ram', label: 'RAM', type: 'chips', options: RAM, showIf: (v) => matchType(v, ['Phones', 'Computers']) },
    { key: 'os', label: 'Operating system', type: 'chips', options: OS, showIf: (v) => matchType(v, ['Phones', 'Computers']) },
    { key: 'screenSize', label: 'Screen size', type: 'number', unit: '"', helper: 'e.g. 55"', showIf: (v) => matchType(v, ['TV & Audio', 'Computers']) },
    { key: 'condition', label: 'Condition', type: 'chips', options: CONDITIONS, top: 'condition', required: true },
    { key: 'warranty', label: 'Under warranty', type: 'toggle' },
    { key: 'accessories', label: 'Accessories included', type: 'text', helper: 'e.g. Charger, box, case' },
  ],
};
const matchType = (v, list) => list.includes(one(v.type));

// ---------------- Fashion ----------------
const FASHION = {
  titleExample: 'e.g. Nike Air Jordan 1 Retro High',
  descriptionHelp: 'Mention brand, size, condition, material and any flaws.',
  photoSlots: ['Front', 'Back', 'Detail', 'Label / tag', 'On (optional)'],
  fields: [
    { key: 'type', label: 'Product type', type: 'chips', options: ['Shoes', 'Clothing', 'Bags', 'Watches', 'Accessories'], top: 'subcategory', required: true },
    { key: 'brand', label: 'Brand', type: 'select', options: ['Nike', 'Adidas', 'Gucci', 'Louis Vuitton', 'Zara', 'H&M', 'Rolex', 'Puma', 'Levi’s', 'Prada', 'Versace', 'Other'], top: 'brand', placeholder: 'Search or type a brand…' },
    { key: 'gender', label: 'Category', type: 'chips', options: GENDERS },
    { key: 'size', label: 'Size', type: 'chips', options: CLOTHING_SIZES, helper: 'Or type a specific size (e.g. EU 43).' },
    { key: 'colour', label: 'Colour', type: 'chips', options: COLOURS },
    { key: 'material', label: 'Material', type: 'chips', options: MATERIALS },
    { key: 'condition', label: 'Condition', type: 'chips', options: CONDITIONS, top: 'condition', required: true },
  ],
};

// ---------------- Jobs ----------------
const JOBS = {
  titleExample: 'e.g. Financial Analyst',
  descriptionHelp: 'Describe the role, responsibilities, requirements and how to apply.',
  photoSlots: ['Company logo', 'Workplace', 'Additional'],
  isJob: true,
  fields: [
    { key: 'employer', label: 'Employer', type: 'text', helper: 'e.g. Zanaco', top: 'brand' },
    { key: 'jobCategory', label: 'Job category', type: 'select', options: JOB_CATEGORIES, required: true, placeholder: 'Search or type…' },
    { key: 'industry', label: 'Industry', type: 'chips', options: INDUSTRIES },
    { key: 'jobType', label: 'Employment type', type: 'chips', options: JOB_TYPES, required: true },
    { key: 'workMode', label: 'Work mode', type: 'chips', options: WORK_MODES, required: true },
    { key: 'experience', label: 'Experience level', type: 'chips', options: EXPERIENCE_LEVELS },
    { key: 'education', label: 'Education', type: 'chips', options: EDUCATION_LEVELS },
    { key: 'skills', label: 'Key skills', type: 'chips', options: ['Communication', 'Excel', 'Accounting', 'Sales', 'Leadership', 'Programming', 'Marketing', 'Customer service', 'Driving'], multi: true, helper: 'Add the skills that matter — or your own.' },
    { key: 'applyMethod', label: 'How to apply', type: 'chips', options: ['Apply on Kaira', 'Email CV', 'Phone call', 'Company website'], multi: false },
  ],
};

// ---------------- Services ----------------
const SERVICES = {
  titleExample: 'e.g. Professional Moving Services',
  descriptionHelp: 'Describe what you offer, your experience and what makes your service reliable.',
  photoSlots: ['Work sample 1', 'Work sample 2', 'Team / tools', 'Additional'],
  fields: [
    { key: 'serviceCategory', label: 'Service category', type: 'select', options: ['Moving', 'Cleaning', 'Plumbing', 'Electrical', 'Construction', 'Beauty', 'Tutoring', 'Photography', 'IT & Repairs', 'Catering', 'Transport', 'Other'], top: 'subcategory', required: true, placeholder: 'Search or type…' },
    { key: 'pricingModel', label: 'Pricing model', type: 'chips', options: SERVICE_PRICING, multi: false, required: true },
    { key: 'experience', label: 'Experience', type: 'chips', options: ['Under 1 year', '1–3 years', '3–5 years', '5+ years'] },
    { key: 'availability', label: 'Availability', type: 'chips', options: ['Weekdays', 'Weekends', 'Evenings', '24/7', 'By appointment'], multi: true },
    { key: 'qualification', label: 'Qualifications / certifications', type: 'text', helper: 'e.g. Licensed electrician' },
  ],
};

// ---------------- Simpler categories ----------------
const FURNITURE = {
  titleExample: 'e.g. Modern 6-Seater Dining Table',
  descriptionHelp: 'Mention material, dimensions, condition and pickup/delivery.',
  photoSlots: ['Front', 'Side', 'Detail', 'In room', 'Additional'],
  fields: [
    { key: 'type', label: 'Type', type: 'chips', options: ['Sofa', 'Table', 'Chair', 'Bed', 'Storage', 'Lighting', 'Desk', 'Other'], top: 'subcategory' },
    { key: 'brand', label: 'Brand', type: 'text', helper: 'Optional — e.g. Fogia' },
    { key: 'material', label: 'Material', type: 'chips', options: ['Wood', 'Metal', 'Glass', 'Fabric', 'Leather', 'Plastic', 'Rattan'] },
    { key: 'colour', label: 'Colour', type: 'chips', options: COLOURS },
    { key: 'condition', label: 'Condition', type: 'chips', options: CONDITIONS, top: 'condition', required: true },
  ],
};
const PETS = {
  titleExample: 'e.g. Boerboel Puppies — vaccinated',
  descriptionHelp: 'Mention breed, age, vaccination, temperament and readiness.',
  photoSlots: ['Photo 1', 'Photo 2', 'Photo 3', 'Additional'],
  fields: [
    { key: 'type', label: 'Type', type: 'chips', options: ['Dogs', 'Cats', 'Birds', 'Horses', 'Fish', 'Other'], top: 'subcategory', required: true },
    { key: 'breed', label: 'Breed', type: 'text', helper: 'e.g. Boerboel' },
    { key: 'age', label: 'Age', type: 'text', helper: 'e.g. 8 weeks' },
    { key: 'vaccinated', label: 'Vaccinated', type: 'toggle' },
    { key: 'pedigree', label: 'Pedigree / papers', type: 'toggle' },
  ],
};
const DEFAULT = {
  titleExample: 'e.g. What are you selling?',
  descriptionHelp: 'Describe your item — condition, key details and why you’re selling.',
  photoSlots: ['Photo 1', 'Photo 2', 'Photo 3', 'Additional'],
  fields: [
    { key: 'type', label: 'Type', type: 'text', helper: 'Optional', top: 'subcategory' },
    { key: 'brand', label: 'Brand', type: 'text', helper: 'Optional' },
    { key: 'condition', label: 'Condition', type: 'chips', options: CONDITIONS, top: 'condition', required: true },
  ],
};

const SCHEMAS = {
  vehicles: VEHICLES,
  motorcycles: { ...VEHICLES, titleExample: 'e.g. KTM 890 Adventure R 2021', photoSlots: ['Left side', 'Right side', 'Front', 'Rear', 'Engine', 'Dashboard', 'Additional'] },
  boats: { ...VEHICLES, titleExample: 'e.g. Axopar 28 Cabin 2022', photoSlots: ['Exterior', 'Cockpit', 'Cabin', 'Engine', 'Additional'] },
  property: PROPERTY,
  electronics: ELECTRONICS,
  fashion: FASHION,
  jobs: JOBS,
  services: SERVICES,
  furniture: FURNITURE,
  pets: PETS,
  collectibles: { ...DEFAULT, titleExample: 'e.g. Pokémon Base Set Charizard PSA 8' },
  sports: { ...DEFAULT, titleExample: 'e.g. Canyon Ultimate CF SLX road bike' },
  business: { ...DEFAULT, titleExample: 'e.g. Commercial pizza oven' },
  everything: DEFAULT,
};

export function listingSchema(categoryId) {
  return SCHEMAS[categoryId] || DEFAULT;
}

// Which fields are visible for the current values (progressive disclosure).
export function visibleFields(schema, values) {
  return schema.fields.filter((f) => !f.showIf || f.showIf(values));
}

// Missing required fields (for gating the Continue button).
export function missingRequired(schema, values, base) {
  const req = [];
  for (const f of visibleFields(schema, values)) {
    if (!f.required) continue;
    const v = f.top ? base[f.top] : values[f.key];
    const empty = v == null || v === '' || (Array.isArray(v) && v.length === 0);
    if (empty) req.push(f.label);
  }
  return req;
}
