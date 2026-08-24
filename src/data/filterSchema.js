// ============================================================
// Kaira category-aware filter framework.
//
// Each category resolves to a *schema*: an ordered list of filter definitions.
// The Search UI and the filter engine are BOTH driven by these schemas, so a
// new category is added by writing a schema here — no UI or engine changes.
//
// Filter definition shape:
//   {
//     key,            unique id + the value bucket key
//     label,          section heading / chip label
//     type,           'chips' | 'select' | 'range' | 'price' | 'toggle' | 'location'
//     field,          listing attribute to match (defaults to key; attrs-aware)
//     options,        string[] for chips/select
//     optionsFrom,    (values) => string[]  — dynamic/dependent options
//     dependsOn,      key of the filter this one depends on
//     multi,          chips/select allow multiple (default true)
//     searchable,     select renders a search box (long lists)
//     quick,          show as a quick filter above results
//     unit,           range suffix (e.g. 'km', 'yr')
//     quickRanges,    [{label,min,max}] shortcuts for price/range
//     min,max,step,   numeric bounds/step for range
//     placeholder,    hint for empty select
//   }
// ============================================================

import { CONDITIONS } from './categories.js';

// ---------- shared option lists ----------
export const VEHICLE_TYPES = ['Car', 'SUV', 'Pickup', 'Van', 'Truck', 'Bus', 'Motorcycle', 'Other'];
export const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'Plug-in Hybrid', 'Other'];
export const TRANSMISSIONS = ['Automatic', 'Manual', 'Other'];
export const BODY_TYPES = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Wagon', 'Convertible', 'Pickup', 'Minivan', 'Other'];
export const SELLER_TYPES = ['Private seller', 'Dealer', 'Business'];
export const VEHICLE_LISTING_TYPES = ['For Sale', 'Auction', 'Negotiable'];
export const USED_NEW = ['New', 'Used', 'Refurbished', 'Other'];

// Makes → models (searchable; model options depend on the chosen make)
export const VEHICLE_MAKES = {
  Toyota: ['Corolla', 'Hilux', 'Land Cruiser', 'RAV4', 'Fortuner', 'Camry', 'Vitz', 'Prado', 'Harrier', 'Premio'],
  BMW: ['1 Series', '3 Series', '5 Series', 'X1', 'X3', 'X5', 'X6', 'M3', 'M5', 'i4', 'iX'],
  'Mercedes-Benz': ['A-Class', 'C-Class', 'E-Class', 'S-Class', 'GLA', 'GLC', 'GLE', 'G-Class'],
  Hyundai: ['i10', 'i20', 'Elantra', 'Tucson', 'Santa Fe', 'Creta', 'Kona'],
  Nissan: ['Note', 'Juke', 'Qashqai', 'X-Trail', 'Navara', 'Patrol'],
  Audi: ['A3', 'A4', 'A6', 'Q3', 'Q5', 'Q7', 'RS6', 'e-tron'],
  Volkswagen: ['Polo', 'Golf', 'Passat', 'Tiguan', 'Amarok'],
  Ford: ['Fiesta', 'Focus', 'Ranger', 'Everest', 'EcoSport'],
  Honda: ['Fit', 'Civic', 'Accord', 'CR-V'],
  Mazda: ['Demio', 'Mazda3', 'CX-5', 'BT-50'],
  Mitsubishi: ['ASX', 'Outlander', 'Pajero', 'Triton'],
  Tesla: ['Model 3', 'Model Y', 'Model S', 'Model X'],
  'Land Rover': ['Defender', 'Discovery', 'Range Rover', 'Range Rover Sport', 'Evoque'],
  Lexus: ['IS', 'NX', 'RX', 'LX'],
  Kia: ['Picanto', 'Rio', 'Seltos', 'Sportage', 'Sorento'],
  Isuzu: ['D-Max', 'MU-X', 'KB'],
  Suzuki: ['Swift', 'Vitara', 'Jimny', 'Alto'],
  Subaru: ['Impreza', 'Forester', 'Outback', 'Legacy', 'XV'],
  Volvo: ['XC40', 'XC60', 'XC90', 'S60', 'V60'],
  Porsche: ['911', 'Cayenne', 'Macan', 'Panamera', 'Taycan'],
  BYD: ['Atto 3', 'Dolphin', 'Seal', 'Tang', 'Han'],
  Peugeot: ['208', '2008', '3008', '308', '508'],
  Renault: ['Clio', 'Duster', 'Kwid', 'Megane', 'Koleos'],
  Jeep: ['Wrangler', 'Grand Cherokee', 'Compass', 'Renegade'],
  Chevrolet: ['Spark', 'Aveo', 'Trailblazer', 'Captiva', 'Silverado'],
  Other: [],
};
export const VEHICLE_MAKE_NAMES = Object.keys(VEHICLE_MAKES);

// Property
export const PROPERTY_TYPES = ['House', 'Apartment', 'Townhouse', 'Flat', 'Commercial', 'Office', 'Cabin', 'Other'];
export const PROPERTY_KIND = ['For Sale', 'For Rent'];
export const PROPERTY_SELLER = ['Private seller', 'Agent', 'Developer'];

// Land / plots
export const LAND_USE = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed use'];

// Electronics
export const ELECTRONICS_TYPES = ['Phones', 'Computers', 'TV & Audio', 'Gaming', 'Cameras', 'Accessories'];
export const ELECTRONICS_BRANDS = ['Apple', 'Samsung', 'Sony', 'LG', 'Dell', 'HP', 'Lenovo', 'Asus', 'Google', 'Xiaomi', 'Huawei', 'Microsoft', 'Canon', 'Nikon', 'Other'];

// Jobs
export const JOB_CATEGORIES = ['Sales', 'IT & Software', 'Finance', 'Engineering', 'Healthcare', 'Education', 'Admin', 'Marketing', 'Mining', 'Hospitality', 'Other'];
export const JOB_TYPES = ['Full-time', 'Part-time', 'Contract', 'Temporary', 'Internship'];
export const WORK_MODES = ['On-site', 'Hybrid', 'Remote'];
export const EXPERIENCE_LEVELS = ['Entry', 'Mid', 'Senior', 'Executive'];
export const EDUCATION_LEVELS = ['Certificate', 'Diploma', 'Degree', 'Masters'];
export const DATE_POSTED = ['Last 24 hours', 'Last 7 days', 'Last 30 days'];

// price shortcuts
const PRICE_RANGES_VEHICLE = [
  { label: 'Under K200k', max: 200000 },
  { label: 'K200k–500k', min: 200000, max: 500000 },
  { label: 'K500k–1M', min: 500000, max: 1000000 },
  { label: 'K1M–3M', min: 1000000, max: 3000000 },
  { label: 'K3M+', min: 3000000 },
];
const PRICE_RANGES_PROPERTY = [
  { label: 'Under K1M', max: 1000000 },
  { label: 'K1M–3M', min: 1000000, max: 3000000 },
  { label: 'K3M–8M', min: 3000000, max: 8000000 },
  { label: 'K8M+', min: 8000000 },
];
const PRICE_RANGES_GENERIC = [
  { label: 'Under K5k', max: 5000 },
  { label: 'K5k–20k', min: 5000, max: 20000 },
  { label: 'K20k–100k', min: 20000, max: 100000 },
  { label: 'K100k+', min: 100000 },
];
const SALARY_RANGES = [
  { label: 'Under K5k/mo', max: 5000 },
  { label: 'K5k–15k', min: 5000, max: 15000 },
  { label: 'K15k–30k', min: 15000, max: 30000 },
  { label: 'K30k+', min: 30000 },
];

// ---------- definition builders ----------
const location = (opts = {}) => ({ key: 'location', label: 'Location', type: 'location', quick: true, ...opts });
const price = (quickRanges = PRICE_RANGES_GENERIC, opts = {}) => ({
  key: 'price', label: 'Price', type: 'price', field: 'price', unit: 'K', quick: true, quickRanges, ...opts,
});

// ============================================================
// Schemas
// ============================================================
const VEHICLE_SCHEMA = {
  id: 'vehicles',
  filters: [
    { key: 'vehicleType', label: 'Vehicle type', type: 'chips', field: 'vehicleType', options: VEHICLE_TYPES },
    { key: 'fuel', label: 'Fuel / power', type: 'chips', field: 'fuel', options: FUEL_TYPES, quick: true },
    { key: 'make', label: 'Make / brand', type: 'select', field: 'brand', options: VEHICLE_MAKE_NAMES, searchable: true, multi: true, quick: true, placeholder: 'Any make' },
    {
      key: 'model', label: 'Model', type: 'select', field: 'model', searchable: true, multi: true,
      dependsOn: 'make', placeholder: 'Select a make first',
      optionsFrom: (v) => (v.make?.length ? [...new Set(v.make.flatMap((m) => VEHICLE_MAKES[m] || []))].sort() : []),
    },
    price(PRICE_RANGES_VEHICLE),
    location(),
    { key: 'condition', label: 'Condition', type: 'chips', field: 'saleCondition', options: USED_NEW, quick: true },
    { key: 'year', label: 'Year', type: 'range', field: 'year', min: 1980, max: 2026, unit: 'yr', quick: true },
    { key: 'mileage', label: 'Mileage', type: 'range', field: 'mileage', min: 0, max: 400000, step: 1000, unit: 'km' },
    { key: 'transmission', label: 'Transmission', type: 'chips', field: 'transmission', options: TRANSMISSIONS },
    { key: 'bodyType', label: 'Body type', type: 'chips', field: 'bodyType', options: BODY_TYPES },
    { key: 'sellerType', label: 'Seller type', type: 'chips', field: 'sellerType', options: SELLER_TYPES },
    { key: 'listingType', label: 'Listing type', type: 'chips', field: 'listingType', options: VEHICLE_LISTING_TYPES },
  ],
};

const MOTORCYCLE_SCHEMA = {
  id: 'motorcycles',
  filters: [
    { key: 'make', label: 'Make / brand', type: 'select', field: 'brand', options: ['Honda', 'Yamaha', 'KTM', 'Suzuki', 'BMW', 'Harley-Davidson', 'Ducati', 'Bajaj', 'TVS', 'Other'], searchable: true, quick: true, placeholder: 'Any make' },
    price(PRICE_RANGES_VEHICLE),
    location(),
    { key: 'condition', label: 'Condition', type: 'chips', field: 'saleCondition', options: USED_NEW, quick: true },
    { key: 'year', label: 'Year', type: 'range', field: 'year', min: 1980, max: 2026, unit: 'yr', quick: true },
    { key: 'mileage', label: 'Mileage', type: 'range', field: 'mileage', min: 0, max: 200000, step: 500, unit: 'km' },
    { key: 'sellerType', label: 'Seller type', type: 'chips', field: 'sellerType', options: SELLER_TYPES },
  ],
};

const PROPERTY_SCHEMA = {
  id: 'property',
  filters: [
    { key: 'propertyType', label: 'Property type', type: 'chips', field: 'propertyType', options: PROPERTY_TYPES, quick: true },
    { key: 'listingKind', label: 'For sale / rent', type: 'chips', field: 'listingKind', options: PROPERTY_KIND, multi: false, quick: true },
    price(PRICE_RANGES_PROPERTY),
    location(),
    { key: 'bedrooms', label: 'Bedrooms (min)', type: 'range', field: 'bedrooms', min: 0, max: 10, onlyMin: true, quick: true },
    { key: 'bathrooms', label: 'Bathrooms (min)', type: 'range', field: 'bathrooms', min: 0, max: 10, onlyMin: true },
    { key: 'buildingSize', label: 'Building size', type: 'range', field: 'buildingSize', min: 0, max: 2000, step: 10, unit: 'm²' },
    { key: 'furnished', label: 'Furnished', type: 'toggle', field: 'furnished' },
    { key: 'parking', label: 'Parking', type: 'toggle', field: 'parking' },
    { key: 'security', label: 'Security (wall/fence)', type: 'toggle', field: 'security' },
    { key: 'pool', label: 'Swimming pool', type: 'toggle', field: 'pool' },
    { key: 'garden', label: 'Garden', type: 'toggle', field: 'garden' },
    { key: 'sellerType', label: 'Listed by', type: 'chips', field: 'sellerType', options: PROPERTY_SELLER },
  ],
};

// Land / plots — deliberately no "condition"
const LAND_SCHEMA = {
  id: 'land',
  filters: [
    { key: 'landUse', label: 'Land use', type: 'chips', field: 'landUse', options: LAND_USE, quick: true },
    price(PRICE_RANGES_PROPERTY),
    location(),
    { key: 'plotSize', label: 'Plot size', type: 'range', field: 'plotSize', min: 0, max: 100000, step: 100, unit: 'm²', quick: true },
    { key: 'titleDeed', label: 'Title deed available', type: 'toggle', field: 'titleDeed', quick: true },
    { key: 'serviced', label: 'Serviced', type: 'toggle', field: 'serviced' },
    { key: 'roadAccess', label: 'Road access', type: 'toggle', field: 'roadAccess' },
    { key: 'electricity', label: 'Electricity', type: 'toggle', field: 'electricity' },
    { key: 'water', label: 'Water', type: 'toggle', field: 'water' },
    { key: 'sellerType', label: 'Listed by', type: 'chips', field: 'sellerType', options: PROPERTY_SELLER },
  ],
};

const ELECTRONICS_SCHEMA = {
  id: 'electronics',
  filters: [
    { key: 'type', label: 'Category', type: 'chips', field: 'subcategory', options: ELECTRONICS_TYPES, quick: true },
    { key: 'brand', label: 'Brand', type: 'select', field: 'brand', options: ELECTRONICS_BRANDS, searchable: true, multi: true, quick: true, placeholder: 'Any brand' },
    price(PRICE_RANGES_GENERIC),
    location(),
    { key: 'condition', label: 'Condition', type: 'chips', field: 'saleCondition', options: ['New', 'Used', 'Refurbished'], quick: true },
    { key: 'warranty', label: 'Under warranty', type: 'toggle', field: 'warranty' },
    { key: 'sellerType', label: 'Seller type', type: 'chips', field: 'sellerType', options: SELLER_TYPES },
  ],
};

const JOBS_SCHEMA = {
  id: 'jobs',
  filters: [
    { key: 'jobCategory', label: 'Job category', type: 'select', field: 'jobCategory', options: JOB_CATEGORIES, searchable: true, multi: true, quick: true, placeholder: 'Any category' },
    { key: 'jobType', label: 'Job type', type: 'chips', field: 'jobType', options: JOB_TYPES, quick: true },
    { key: 'workMode', label: 'Work mode', type: 'chips', field: 'workMode', options: WORK_MODES, quick: true },
    { key: 'location', label: 'Location', type: 'location', quick: true },
    { key: 'experience', label: 'Experience level', type: 'chips', field: 'experience', options: EXPERIENCE_LEVELS, quick: true },
    { key: 'salary', label: 'Salary (per month)', type: 'price', field: 'salary', unit: 'K', quickRanges: SALARY_RANGES, quick: true },
    { key: 'education', label: 'Education', type: 'chips', field: 'education', options: EDUCATION_LEVELS },
    { key: 'industry', label: 'Industry', type: 'chips', field: 'industry', options: ['Technology', 'Finance', 'Mining', 'Retail', 'Healthcare', 'Education', 'Government', 'NGO', 'Other'] },
    { key: 'datePosted', label: 'Date posted', type: 'chips', field: 'postedWithin', options: DATE_POSTED, multi: false },
  ],
};

// Generic fallback (fashion, furniture, sports, collectibles, pets, boats, services, business, everything)
const DEFAULT_SCHEMA = {
  id: 'default',
  filters: [
    { key: 'brand', label: 'Brand', type: 'select', field: 'brand', searchable: true, multi: true, quick: true, placeholder: 'Any brand', optionsFrom: null },
    price(PRICE_RANGES_GENERIC),
    location(),
    { key: 'condition', label: 'Condition', type: 'chips', field: 'condition', options: CONDITIONS, quick: true },
    { key: 'sellerType', label: 'Seller type', type: 'chips', field: 'sellerType', options: SELLER_TYPES },
    { key: 'listingType', label: 'Listing type', type: 'chips', field: 'listingType', options: ['For Sale', 'Negotiable'] },
  ],
};

const SCHEMAS = {
  vehicles: VEHICLE_SCHEMA,
  motorcycles: MOTORCYCLE_SCHEMA,
  property: PROPERTY_SCHEMA,
  land: LAND_SCHEMA,
  electronics: ELECTRONICS_SCHEMA,
  jobs: JOBS_SCHEMA,
  default: DEFAULT_SCHEMA,
};

/**
 * Resolve the schema for a category (+ optional subcategory).
 * Property + a land/plot subcategory swaps to the land schema.
 */
export function schemaFor(categoryId, subcategory) {
  if (categoryId === 'property' && /plot|land/i.test(subcategory || '')) return LAND_SCHEMA;
  return SCHEMAS[categoryId] || DEFAULT_SCHEMA;
}

// Filters flagged as quick, in schema order.
export function quickFilters(schema) {
  return schema.filters.filter((f) => f.quick);
}

// Resolve options for a filter given current values (handles dependencies).
export function resolveOptions(def, values) {
  if (def.optionsFrom) return def.optionsFrom(values) || [];
  return def.options || [];
}

// Fill in data-driven options (e.g. the generic "brand" filter) from the
// listings actually present in the category, so options are never meaningless.
export function hydrateSchema(schema, listings) {
  return {
    ...schema,
    filters: schema.filters.map((def) => {
      if ((def.type === 'select' || def.type === 'chips') && !def.options && !def.optionsFrom) {
        const field = def.field || def.key;
        const opts = [...new Set(listings.map((l) => l[field] ?? l.attrs?.[field]).filter(Boolean))].sort();
        return { ...def, options: opts };
      }
      return def;
    }),
  };
}
