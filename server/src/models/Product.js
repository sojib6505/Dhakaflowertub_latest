import mongoose from 'mongoose';
import { CATEGORY_KEYS } from '../config/categories.js';

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [160, 'Product name cannot exceed 160 characters']
    },
    slug: {
      type: String,
      required: [true, 'Product slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [300, 'Short description cannot exceed 300 characters']
    },
    description: {
      type: String,
      trim: true
    },
    // Stable key of one of the four business categories (see config/categories.js).
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      lowercase: true,
      enum: { values: CATEGORY_KEYS, message: 'Category must be one of: ' + CATEGORY_KEYS.join(', ') },
      index: true
    },
    // Set by the one-time migration: the free-text category this product had before.
    legacyCategory: {
      type: String,
      trim: true,
      select: false
    },
    price: {
      type: Number,
      min: [0, 'Price cannot be negative'],
      default: 0
    },
    priceDisplay: {
      type: String,
      trim: true,
      default: ''
    },
    isPriceCustom: {
      type: Boolean,
      default: false
    },
    images: [
      {
        url: {
          type: String,
          required: true,
          trim: true
        },
        alt: {
          type: String,
          trim: true,
          default: ''
        },
        // Cloudinary public id, present only for images uploaded from the admin dashboard.
        publicId: {
          type: String,
          trim: true
        },
        isPrimary: {
          type: Boolean,
          default: false
        }
      }
    ],
    material: {
      type: String,
      trim: true,
      default: 'Premium Concrete / Fiber'
    },
    finish: {
      type: String,
      trim: true,
      default: 'Matte Smooth'
    },
    dimensions: {
      height: { type: String, default: '' },
      diameter: { type: String, default: '' },
      length: { type: String, default: '' },
      width: { type: String, default: '' }
    },
    specifications: [
      {
        label: { type: String, required: true, trim: true },
        value: { type: String, required: true, trim: true }
      }
    ],
    features: [
      {
        type: String,
        trim: true
      }
    ],
    availability: {
      type: String,
      enum: ['in_stock', 'made_to_order', 'out_of_stock'],
      default: 'in_stock',
      index: true
    },
    badge: {
      type: String,
      trim: true,
      default: ''
    },
    isFeatured: {
      type: Boolean,
      default: false,
      index: true
    },
    sortOrder: {
      type: Number,
      default: 0,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Helpful index for sorting & searching
productSchema.index({ name: 'text', description: 'text', category: 'text' });

const Product = mongoose.models.Product || mongoose.model('Product', productSchema);

export default Product;
