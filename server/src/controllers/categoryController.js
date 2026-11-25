import Category from '../models/Category.js';
import Product from '../models/Product.js';
import { getDBStatus } from '../config/db.js';
import {
  CATEGORY_KEYS,
  DEFAULT_CATEGORIES,
  buildNameToKey
} from '../config/categories.js';

// Creates any of the five categories that are missing. Never overwrites admin edits.
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

// @desc    Get the five categories
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

// @desc    Rename a category or change its description (the five categories cannot be added or removed)
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
