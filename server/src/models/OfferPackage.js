import mongoose from 'mongoose';

const offerPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Offer package title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    slug: {
      type: String,
      required: [true, 'Offer package slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    subtitle: {
      type: String,
      trim: true,
      maxlength: [300, 'Subtitle cannot exceed 300 characters'],
      default: ''
    },
    description: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      url: {
        type: String,
        required: [true, 'Package image URL is required'],
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
      }
    },
    products: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
      }
    ],
    discountType: {
      type: String,
      enum: ['percentage', 'fixed', 'none'],
      default: 'none'
    },
    discountValue: {
      type: Number,
      default: 0,
      min: [0, 'Discount value cannot be negative']
    },
    originalPrice: {
      type: Number,
      min: [0, 'Original price cannot be negative'],
      default: 0
    },
    offerPrice: {
      type: Number,
      min: [0, 'Offer price cannot be negative'],
      default: 0
    },
    priceDisplay: {
      type: String,
      trim: true,
      default: ''
    },
    badge: {
      type: String,
      trim: true,
      default: 'Special Offer'
    },
    features: [
      {
        type: String,
        trim: true
      }
    ],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    startDate: {
      type: Date
    },
    endDate: {
      type: Date
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

offerPackageSchema.index({ title: 'text', description: 'text', subtitle: 'text' });

const OfferPackage = mongoose.models.OfferPackage || mongoose.model('OfferPackage', offerPackageSchema);

export default OfferPackage;
