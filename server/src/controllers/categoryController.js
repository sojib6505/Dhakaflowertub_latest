import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { getDBStatus } from '../config/db.js';
import {
  CATEGORY_KEYS,
  DEFAULT_CATEGORIES,
  DEFAULT_CATEGORY_KEY,
  LEGACY_CATEGORY_MAP,
  buildNameToKey,
  resolveCategoryKey
} from '../config/categories.js';

// Creates any of the four categories that are missing. Never overwrites admin edits.
export const ensureCategories = async () => {
  await Promise.all(
    DEFAULT_CATEGORIES.map((category) =>
      Category.updateOne({ key: category.key }, { $setOnInsert: category }, { upsert: true })
    )
  );
};

export const loadCategories = async () => {
  if ((await Category.countDocuments({ key: { $in: CATEGORY_KEYS } })) < CATEGORY_KEYS.length) {
    await ensureCategories();
  }
  return Category.find({ key: { $in: CATEGORY_KEYS } }).sort({ sortOrder: 1 }).lean();
};

// Maps products saved with the old free-text categories onto the four business categories.
// Nothing is deleted: unknown values fall back to Residential and the old value is kept in legacyCategory.
export const migrateProductCategories = async () => {
  const categories = await loadCategories();
  const nameToKey = buildNameToKey(categories);
  const outdated = await Product.find({ category: { $nin: CATEGORY_KEYS } }).select('_id category').lean();

  if (outdated.length === 0) return { migrated: 0 };

  await Product.bulkWrite(
    outdated.map((product) => ({
      updateOne: {
        filter: { _id: product._id },
        update: {
          $set: {
            category: resolveCategoryKey(product.category, nameToKey) || DEFAULT_CATEGORY_KEY,
            legacyCategory: String(product.category ?? '')
          }
        }
      }
    }))
  );

  console.log(`[Categories] Migrated ${outdated.length} product(s) to the four business categories.`);
  return { migrated: outdated.length };
};

// @desc    Get the four categories
// @route   GET /api/categories
export const getCategories = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.json({ success: true, source: 'fallback', data: DEFAULT_CATEGORIES });
    }

    const categories = await loadCategories();
    return res.json({ success: true, source: 'database', data: categories });
  } catch (error) {
    return next(error);
  }
};

// @desc    Rename a category or change its description (the four categories cannot be added or removed)
// @route   PUT /api/categories/:key
export const updateCategory = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to update categories.' });
    }

    const { key } = req.params;
    if (!CATEGORY_KEYS.includes(key)) {
      return res.status(404).json({ success: false, message: 'Category not found.' });
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const description = typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Category name is required.' });
    }

    const categories = await loadCategories();
    const clash = categories.find((category) => category.key !== key && category.name.trim().toLowerCase() === name.toLowerCase());
    if (clash) {
      return res.status(400).json({ success: false, message: `Another category is already named "${clash.name}".` });
    }
    // A name that matches an old product category would make legacy values resolve to the wrong place.
    if (LEGACY_CATEGORY_MAP[name.toLowerCase()] && LEGACY_CATEGORY_MAP[name.toLowerCase()] !== key) {
      return res.status(400).json({ success: false, message: 'Please choose a different category name.' });
    }

    const updated = await Category.findOneAndUpdate(
      { key },
      { $set: { name, description } },
      { new: true, runValidators: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.json({ success: true, message: 'Category updated successfully', data: updated });
  } catch (error) {
    return next(error);
  }
};
