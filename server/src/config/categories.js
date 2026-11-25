// The catalogue always has exactly five business categories.
// Products store stable `key` values in an array; admins can edit only `name` and `description`.
export const CATEGORY_KEYS = ['planters-tub', 'planter-sets', 'plants', 'landscaping', 'essentials-services'];

export const DEFAULT_CATEGORIES = [
  { key: 'planters-tub', name: 'Planters & Tub', description: 'Decorative planters and premium tubs', sortOrder: 1 },
  { key: 'planter-sets', name: 'Planter Sets', description: 'Beautifully curated planter combinations', sortOrder: 2 },
  { key: 'plants', name: 'Plants', description: 'Indoor, outdoor and decorative plants', sortOrder: 3 },
  { key: 'landscaping', name: 'Landscaping', description: 'Landscape design and greenery solutions', sortOrder: 4 },
  { key: 'essentials-services', name: 'Essentials & Services', description: 'Gardening essentials and related services', sortOrder: 5 }
];

export const DEFAULT_CATEGORY_KEY = 'planters-tub';

// Resolves a key or a current display name to a category key. Returns null if unknown.
export const resolveCategoryKey = (value, nameToKey = {}) => {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  if (CATEGORY_KEYS.includes(normalized)) return normalized;
  if (nameToKey[normalized]) return nameToKey[normalized];
  return null;
};

export const buildNameToKey = (categories) =>
  Object.fromEntries(categories.map((category) => [category.name.trim().toLowerCase(), category.key]));
