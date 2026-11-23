import OfferPackage from '../models/OfferPackage.js';
import { seedOffers as fallbackOffers } from '../data/seedOffers.js';
import { getDBStatus } from '../config/db.js';
import { destroyImages } from '../utils/cloudinary.js';
import {
  cleanImage,
  cleanStringList,
  escapeRegex,
  generateSlug,
  isObjectId,
  pick,
  slugOrFallback
} from '../utils/sanitize.js';

const EDITABLE_FIELDS = [
  'title', 'slug', 'subtitle', 'description', 'image', 'discountType', 'discountValue', 'originalPrice',
  'offerPrice', 'priceDisplay', 'badge', 'features', 'isActive', 'sortOrder'
];

const imageIds = (offer) => (offer?.image?.publicId ? [offer.image.publicId] : []);

// Validates and normalises the editable payload. Returns { data } or { error }.
const buildOfferData = (body, { partial }) => {
  const data = pick(body, EDITABLE_FIELDS);

  if (data.title !== undefined) {
    data.title = String(data.title).trim();
    if (!data.title) return { error: 'Please provide offer package title.' };
  } else if (!partial) {
    return { error: 'Please provide offer package title.' };
  }

  if (data.image !== undefined || !partial) {
    const image = cleanImage(data.image);
    if (!image) return { error: 'Please upload an offer package image.' };
    delete image.isPrimary;
    data.image = { ...image, alt: image.alt || data.title || '' };
  }

  if (data.features !== undefined) data.features = cleanStringList(data.features);
  ['discountValue', 'originalPrice', 'offerPrice', 'sortOrder'].forEach((field) => {
    if (data[field] !== undefined) data[field] = Number(data[field]) || 0;
  });

  if (data.discountType !== undefined && !['percentage', 'fixed', 'none'].includes(data.discountType)) {
    return { error: 'Discount type must be percentage, fixed or none.' };
  }
  if (data.discountType === 'percentage' && data.discountValue > 100) {
    return { error: 'A percentage discount cannot be more than 100.' };
  }
  if (data.originalPrice > 0 && data.offerPrice > data.originalPrice) {
    return { error: 'Offer price cannot be higher than the original price.' };
  }
  if (!partial && !(data.offerPrice > 0)) {
    return { error: 'Please provide an offer price.' };
  }

  if (data.priceDisplay !== undefined) data.priceDisplay = String(data.priceDisplay).trim();
  if (data.isActive !== undefined) data.isActive = Boolean(data.isActive);

  return { data };
};

// @desc    Get all offer packages
// @route   GET /api/offers
export const getOfferPackages = async (req, res, next) => {
  try {
    const { active, search, sort = 'sortOrder' } = req.query;
    const dbStatus = getDBStatus();

    if (dbStatus.connected) {
      const query = {};

      if (active !== 'false') {
        query.isActive = true;
      }

      if (search) {
        query.$or = [
          { title: { $regex: escapeRegex(search), $options: 'i' } },
          { subtitle: { $regex: escapeRegex(search), $options: 'i' } },
          { description: { $regex: escapeRegex(search), $options: 'i' } }
        ];
      }

      let sortOption = { sortOrder: 1, createdAt: -1 };
      if (sort === 'price_asc') sortOption = { offerPrice: 1 };
      if (sort === 'price_desc') sortOption = { offerPrice: -1 };
      if (sort === 'newest') sortOption = { createdAt: -1 };

      const packages = await OfferPackage.find(query)
        .populate('products', 'name slug price images category')
        .sort(sortOption);

      return res.json({
        success: true,
        source: 'database',
        count: packages.length,
        data: packages
      });
    }

    // Resilient fallback when DB is disconnected
    let filtered = [...fallbackOffers];

    if (active !== 'false') {
      filtered = filtered.filter((item) => item.isActive);
    }

    if (search) {
      const term = search.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.title.toLowerCase().includes(term) ||
          item.subtitle?.toLowerCase().includes(term) ||
          item.description?.toLowerCase().includes(term)
      );
    }

    if (sort === 'price_asc') filtered.sort((a, b) => a.offerPrice - b.offerPrice);
    if (sort === 'price_desc') filtered.sort((a, b) => b.offerPrice - a.offerPrice);
    if (sort === 'sortOrder') filtered.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    return res.json({
      success: true,
      source: 'fallback',
      message: 'Serving curated seed offers (MongoDB disconnected)',
      count: filtered.length,
      data: filtered
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single offer package by slug or id
// @route   GET /api/offers/:slugOrId
export const getOfferPackageBySlugOrId = async (req, res, next) => {
  try {
    const { slugOrId } = req.params;
    const dbStatus = getDBStatus();

    if (dbStatus.connected) {
      let offer = null;

      if (isObjectId(slugOrId)) {
        offer = await OfferPackage.findById(slugOrId).populate('products');
      }

      if (!offer) {
        offer = await OfferPackage.findOne({ slug: slugOrId.toLowerCase() }).populate('products');
      }

      if (!offer) {
        return res.status(404).json({
          success: false,
          message: `Offer package not found with identifier: ${slugOrId}`
        });
      }

      return res.json({
        success: true,
        source: 'database',
        data: offer
      });
    }

    const offer = fallbackOffers.find(
      (item) => item.slug === slugOrId.toLowerCase() || item.slug === slugOrId
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: `Offer package not found with identifier: ${slugOrId}`
      });
    }

    return res.json({
      success: true,
      source: 'fallback',
      data: offer
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new offer package
// @route   POST /api/offers
export const createOfferPackage = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to create offer packages.' });
    }

    const { data, error } = buildOfferData(req.body, { partial: false });
    if (error) return res.status(400).json({ success: false, message: error });

    // A blank slug field must fall back to the title-based slug.
    const slug = generateSlug(data.slug) || slugOrFallback(data.title, 'offer');
    if (await OfferPackage.findOne({ slug })) {
      return res.status(400).json({ success: false, message: `An offer package with slug "${slug}" already exists.` });
    }

    const offer = await OfferPackage.create({
      ...data,
      slug,
      priceDisplay: data.priceDisplay || (data.offerPrice ? `৳ ${data.offerPrice.toLocaleString()}` : '')
    });

    return res.status(201).json({ success: true, message: 'Offer package created successfully', data: offer });
  } catch (error) {
    return next(error);
  }
};

// @desc    Update an offer package
// @route   PUT /api/offers/:slugOrId
export const updateOfferPackage = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to update offer packages.' });
    }

    const { slugOrId } = req.params;
    const filter = isObjectId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId.toLowerCase() };
    const existing = await OfferPackage.findOne(filter);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Offer package not found to update' });
    }

    const { data, error } = buildOfferData(req.body, { partial: true });
    if (error) return res.status(400).json({ success: false, message: error });

    // Cross-field rules also need to hold when only one of the fields is being changed.
    const originalPrice = data.originalPrice ?? existing.originalPrice;
    const offerPrice = data.offerPrice ?? existing.offerPrice;
    if (originalPrice > 0 && offerPrice > originalPrice) {
      return res.status(400).json({ success: false, message: 'Offer price cannot be higher than the original price.' });
    }

    // Keep the current slug unless a different one was explicitly provided.
    const requestedSlug = generateSlug(data.slug);
    if (requestedSlug && requestedSlug !== existing.slug) {
      if (await OfferPackage.findOne({ slug: requestedSlug, _id: { $ne: existing._id } })) {
        return res.status(400).json({ success: false, message: `An offer package with slug "${requestedSlug}" already exists.` });
      }
      data.slug = requestedSlug;
    } else {
      delete data.slug;
    }

    const updated = await OfferPackage.findByIdAndUpdate(existing._id, { $set: data }, { new: true, runValidators: true });

    // Remove the replaced image from storage (best effort).
    if (data.image !== undefined && imageIds(existing)[0] && imageIds(existing)[0] !== imageIds(updated)[0]) {
      destroyImages(imageIds(existing));
    }

    return res.json({ success: true, message: 'Offer package updated successfully', data: updated });
  } catch (error) {
    return next(error);
  }
};

// @desc    Delete an offer package
// @route   DELETE /api/offers/:slugOrId
export const deleteOfferPackage = async (req, res, next) => {
  try {
    if (!getDBStatus().connected) {
      return res.status(503).json({ success: false, message: 'Database connection required to delete offer packages.' });
    }

    const { slugOrId } = req.params;
    const filter = isObjectId(slugOrId) ? { _id: slugOrId } : { slug: slugOrId.toLowerCase() };
    const deleted = await OfferPackage.findOneAndDelete(filter);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Offer package not found to delete' });
    }

    destroyImages(imageIds(deleted));

    return res.json({ success: true, message: 'Offer package deleted successfully', data: { id: deleted._id } });
  } catch (error) {
    return next(error);
  }
};
