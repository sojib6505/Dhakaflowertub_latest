import Product from '../models/Product.js';
import { seedProducts as fallbackProducts } from '../data/seedProducts.js';
import { getDBStatus } from '../config/db.js';
import Category from '../models/Category.js';
import {
  CATEGORY_KEYS,
  DEFAULT_CATEGORIES,
  buildNameToKey,
  resolveCategoryKey
} from '../config/categories.js';
import { destroyImages } from '../utils/cloudinary.js';
import {
  cleanImages,
  cleanStringList,
  escapeRegex,
  generateSlug,
  isObjectId,
  pick,
  slugOrFallback
} from '../utils/sanitize.js';

const EDITABLE_FIELDS = [
  'name', 'slug', 'categories', 'shortDescription', 'description', 'price', 'oldPrice', 'variants', 'priceDisplay', 'isPriceCustom',
  'images', 'material', 'finish', 'dimensions', 'specifications', 'features', 'availability', 'badge',
  'isFeatured', 'sortOrder'
];

const categoryError = `All category keys must be one of: ${CATEGORY_KEYS.join(', ')}.`;

const getNameToKey = async () => {
  const categories = await Category.find({ key: { $in: CATEGORY_KEYS } }).select('key name').lean();
  return buildNameToKey(categories.length ? categories : DEFAULT_CATEGORIES);
};

const imagePublicIds = (images = []) => images.map((image) => image?.publicId).filter(Boolean);
const productImagePublicIds = (product) => [
  ...imagePublicIds(product?.images || []),
  ...(product?.variants || []).map((variant) => variant?.image?.publicId).filter(Boolean)
];

/**
 * Accepts categories from the request body as either:
 * - an array of keys: ['planters-tub', 'plants']
 * - a single string key: 'planters-tub'
 * Returns a de-duplicated array of valid keys, or null if any key is invalid.
 */
const resolveCategories = (raw, nameToKey) => {
  const list = Array.isArray(raw) ? raw : (typeof raw === 'string' && raw ? [raw] : []);
  if (list.length === 0) return [];
  const resolved = [];
  for (const item of list) {
    const key = resolveCategoryKey(item, nameToKey);
    if (!key) return null; // unknown key — reject the whole request
    if (!resolved.includes(key)) resolved.push(key);
  }
  return resolved;
};

// Normalises the editable payload shared by create and update.
const buildProductData = (body) => {
  const data = pick(body, EDITABLE_FIELDS);

  if (data.images !== undefined) data.images = cleanImages(data.images);
  if (data.features !== undefined) data.features = cleanStringList(data.features);
  if (data.specifications !== undefined) {
    data.specifications = (Array.isArray(data.specifications) ? data.specifications : [])
      .map((item) => ({ label: String(item?.label ?? '').trim(), value: String(item?.value ?? '').trim() }))
      .filter((item) => item.label && item.value);
  }
  if (data.price !== undefined) data.price = Number(data.price) || 0;
  if (data.oldPrice !== undefined) data.oldPrice = Number(data.oldPrice) || 0;
  if (data.sortOrder !== undefined) data.sortOrder = Number(data.sortOrder) || 0;
  if (Array.isArray(data.variants)) {
    data.variants = data.variants.map((variant, index) => ({
      ...(isObjectId(variant?._id) ? { _id: variant._id } : {}),
      name: String(variant?.name ?? '').trim(),
      price: Number(variant?.price),
      image: variant?.image && typeof variant.image === 'object'
        ? {
            url: String(variant.image.url ?? '').trim(),
            alt: String(variant.image.alt ?? '').trim(),
            publicId: String(variant.image.publicId ?? '').trim()
          }
        : { url: '', alt: '', publicId: '' },
      sortOrder: Number(variant?.sortOrder) || index
    }));
  }

  return data;
};

const validateVariants = (variants) => {
  if (variants === undefined) return null;
  if (!Array.isArray(variants)) return 'Variants must be a list.';

  const names = new Set();
  for (const variant of variants) {
    const name = String(variant.name ?? '').trim();
    const price = Number(variant.price);
    if (!name) return 'Each variant requires a size name.';
    if (!Number.isFinite(price) || price <= 0) return 'Each variant requires a valid positive price.';

    const duplicateKey = name.toLocaleLowerCase();
    if (names.has(duplicateKey)) return `Duplicate variant size name: ${name}.`;
    names.add(duplicateKey);

    const imageUrl = String(variant.image?.url ?? '').trim();
    if (imageUrl) {
      try {
        const parsed = new URL(imageUrl);
        if (!['http:', 'https:'].includes(parsed.protocol)) return 'Variant image must use an HTTP or HTTPS URL.';
      } catch {
        return 'Variant image must use a valid HTTP or HTTPS URL.';
      }
    }
  }
  return null;
};

// @desc    Get all products with filtering, search, and sorting
// @route   GET /api/products
export const getProducts = async (req, res, next) => {
  try {
    const { category, search, featured, availability, sort = 'sortOrder' } = req.query;
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 50, 1), 200);
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const dbStatus = getDBStatus();
    const wantsCategory = category && category !== 'All Collections' && category !== 'All';

    if (dbStatus.connected) {
      const query = {};
      const nameToKey = await getNameToKey();

      if (wantsCategory) {
        // Resolve supplied category name/key to a canonical key; unknown categories match nothing.
        const resolvedKey = resolveCategoryKey(category, nameToKey) || '__none__';
        // A product is in a category when its categories array contains that key.
        query.categories = resolvedKey;
      }

      if (featured === 'true') query.isFeatured = true;
      if (availability) query.availability = availability;

      if (search) {
        const pattern = { $regex: escapeRegex(search), $options: 'i' };
        const matchingCategoryKeys = Object.entries(nameToKey)
          .filter(([name]) => name.includes(String(search).trim().toLowerCase()))
          .map(([, key]) => key);

        query.$or = [
          { name: pattern },
          { shortDescription: pattern },
          { material: pattern },
          ...(matchingCategoryKeys.length ? [{ categories: { $in: matchingCategoryKeys } }] : [])
        ];
      }

      let sortOption = { sortOrder: 1, createdAt: -1 };
      if (sort === 'price_asc') sortOption = { price: 1 };
      if (sort === 'price_desc') sortOption = { price: -1 };
      if (sort === 'newest') sortOption = { createdAt: -1 };

      const total = await Product.countDocuments(query);
      const products = await Product.find(query).sort(sortOption).skip((page - 1) * limit).limit(limit);

      return res.json({
        success: true,
        source: 'database',
        count: products.length,
        total,
        page,
        pages: Math.ceil(total / limit),
        data: products
      });
    }

    // Resilient fallback (in-memory dataset when MongoDB is offline during initial preview)
    const nameToKey = buildNameToKey(DEFAULT_CATEGORIES);
    let filtered = [...fallbackProducts];

    if (wantsCategory) {
      const key = resolveCategoryKey(category, nameToKey);
      filtered = filtered.filter((p) => Array.isArray(p.categories) && p.categories.includes(key));
    }
    if (featured === 'true') filtered = filtered.filter((p) => p.isFeatured);
    if (availability) filtered = filtered.filter((p) => p.availability === availability);

    if (search) {
      const term = String(search).toLowerCase();
      const categoryNames = Object.fromEntries(DEFAULT_CATEGORIES.map((c) => [c.key, c.name.toLowerCase()]));
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.shortDescription?.toLowerCase().includes(term) ||
          (Array.isArray(p.categories) && p.categories.some((k) => categoryNames[k]?.includes(term))) ||
          p.material?.toLowerCase().includes(term)
      );
    }

    if (sort === 'price_asc') filtered.sort((a, b) => a.price - b.price);
    if (sort === 'price_desc') filtered.sort((a, b) => b.price - a.price);
    if (sort === 'sortOrder') filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return res.json({
      success: true,
      source: 'fallback',
      message: 'Serving curated seed data (MongoDB disconnected)',
      count: filtered.length,
      total: filtered.length,
      page: 1,
      pages: 1,
      data: filtered
    });
  } catch (error) {
    return next(error);
  }
};

// @desc    Get single product by slug or id
// @route   GET /api/products/:slugOrId
export const getProductBySlugOrId = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;

    if (getDBStatus().connected) {
      let product = null;

      if (isObjectId(slugOrId)) product = await Product.findById(slugOrId);
      if (!product) product = await Product.findOne({ slug: slugOrId.toLowerCase() });

      if (!product) {
        return res.status(404).json({ success: false, message: `Product not found with identifier: ${slugOrId}` });
      }

      return res.json({ success: true, source: 'database', data: product });
    }

    const product = fallbackProducts.find((p) => p.slug === slugOrId.toLowerCase() || p.slug === slugOrId);

    if (!product) {
      return res.status(404).json({ success: false, message: `Product not found with slug: ${slugOrId}` });
    }

    return res.json({ success: true, source: 'fallback', data: product });
  } catch (error) {
    return next(error);
  }
};

// @desc    Create a new product
// @route   POST /api/products
export const createProduct = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to create new products.' });
    }

    const data = buildProductData(req.body);
    const variantError = validateVariants(data.variants);
    if (variantError) return res.status(400).json({ success: false, message: variantError });
    const name = typeof data.name === 'string' ? data.name.trim() : '';

    if (!name) {
      return res.status(400).json({ success: false, message: 'Please provide a product name.' });
    }

    const nameToKey = await getNameToKey();
    const categories = resolveCategories(data.categories, nameToKey);
    if (categories === null) {
      return res.status(400).json({ success: false, message: categoryError });
    }

    // A blank slug field must fall back to the name-based slug.
    const slug = generateSlug(data.slug) || slugOrFallback(name, 'product');
    if (await Product.findOne({ slug })) {
      return res.status(400).json({
        success: false,
        message: `A product with slug "${slug}" already exists. Please choose a different name or slug.`
      });
    }

    const product = await Product.create({
      ...data,
      name,
      slug,
      categories,
      priceDisplay: data.priceDisplay || (data.price ? `৳ ${data.price.toLocaleString()}` : 'Price on request')
    });

    return res.status(201).json({ success: true, message: 'Product created successfully', data: product });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update an existing product
// @route   PUT /api/products/:id
export const updateProduct = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to update products.' });
    }

    const { slugOrId } = req.params;
    if (!isObjectId(slugOrId)) {
      return res.status(404).json({ success: false, message: 'Product not found to update' });
    }

    const existing = await Product.findById(slugOrId);
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Product not found to update' });
    }

    const data = buildProductData(req.body);
    const variantError = validateVariants(data.variants);
    if (variantError) return res.status(400).json({ success: false, message: variantError });

    if (data.name !== undefined) {
      data.name = String(data.name).trim();
      if (!data.name) return res.status(400).json({ success: false, message: 'Product name is required.' });
    }

    if (data.categories !== undefined) {
      const nameToKey = await getNameToKey();
      const categories = resolveCategories(data.categories, nameToKey);
      if (categories === null) return res.status(400).json({ success: false, message: categoryError });
      data.categories = categories;
    }

    // Keep the current slug unless a different one was explicitly provided.
    const requestedSlug = generateSlug(data.slug);
    if (requestedSlug && requestedSlug !== existing.slug) {
      if (await Product.findOne({ slug: requestedSlug, _id: { $ne: existing._id } })) {
        return res.status(400).json({ success: false, message: `A product with slug "${requestedSlug}" already exists.` });
      }
      data.slug = requestedSlug;
    } else {
      delete data.slug;
    }

    const updated = await Product.findByIdAndUpdate(existing._id, { $set: data }, { new: true, runValidators: true });

    // Remove images that were replaced or removed from storage (best effort).
    if (data.images !== undefined || data.variants !== undefined) {
      const kept = new Set(productImagePublicIds(updated));
      destroyImages(productImagePublicIds(existing).filter((id) => !kept.has(id)));
    }

    return res.json({ success: true, message: 'Product updated successfully', data: updated });
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete a product
// @route   DELETE /api/products/:id
export const deleteProduct = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to delete products.' });
    }

    const { slugOrId } = req.params;
    const deleted = isObjectId(slugOrId) ? await Product.findByIdAndDelete(slugOrId) : null;

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Product not found to delete' });
    }

    destroyImages(productImagePublicIds(deleted));

    return res.json({ success: true, message: 'Product deleted successfully', data: { id: slugOrId } });
  } catch (error) {
    return next(error);
  }
};

// @desc    Seed database with curated catalog
// @route   POST /api/products/seed
export const seedDatabase = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database is not connected. Seed operation cannot proceed.' });
    }

    await Product.deleteMany({});
    const created = await Product.insertMany(fallbackProducts);

    return res.json({
      success: true,
      message: `Database successfully seeded with ${created.length} products.`,
      count: created.length,
      data: created
    });
  } catch (error) {
    return next(error);
  }
};
