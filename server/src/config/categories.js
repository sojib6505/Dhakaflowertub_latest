// The catalogue always has exactly four business categories.
// Products store the stable `key`; admins can edit only `name` and `description`.
export const CATEGORY_KEYS = ['residential', 'corporate', 'commercial', 'hospitality'];

export const DEFAULT_CATEGORIES = [
  { key: 'residential', name: 'Residential', description: 'Homes, balconies & rooftops', sortOrder: 1 },
  { key: 'corporate', name: 'Corporate', description: 'Offices & professional spaces', sortOrder: 2 },
  { key: 'commercial', name: 'Commercial', description: 'Shops, cafés & restaurants', sortOrder: 3 },
  { key: 'hospitality', name: 'Hospitality', description: 'Hotels, resorts & guest spaces', sortOrder: 4 }
];

// One-time mapping for products created before the four business categories existed.
export const LEGACY_CATEGORY_MAP = {
  'indoor planters': 'residential',
  'outdoor tubs': 'hospitality',
  'architectural tubs': 'corporate',
  'ceramic series': 'commercial'
};

export const DEFAULT_CATEGORY_KEY = 'residential';

// Resolves a key, a current display name, or a legacy name to a category key. Returns null if unknown.
export const resolveCategoryKey = (value, nameToKey = {}) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (CATEGORY_KEYS.includes(normalized)) return normalized;
  if (nameToKey[normalized]) return nameToKey[normalized];
  return LEGACY_CATEGORY_MAP[normalized] || null;
};

export const buildNameToKey = (categories) =>
  Object.fromEntries(categories.map((category) => [category.name.trim().toLowerCase(), category.key]));
