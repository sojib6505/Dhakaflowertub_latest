import mongoose from 'mongoose';
import { CATEGORY_KEYS } from '../config/categories.js';

const categorySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      enum: { values: CATEGORY_KEYS, message: 'Category key must be one of: ' + CATEGORY_KEYS.join(', ') },
      immutable: true
    },
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      maxlength: [40, 'Category name cannot exceed 40 characters']
    },
    description: {
      type: String,
      trim: true,
      default: '',
      maxlength: [120, 'Category description cannot exceed 120 characters']
    },
    sortOrder: { type: Number, default: 0 }
  },
  { timestamps: true }
);

const Category = mongoose.models.Category || mongoose.model('Category', categorySchema);

export default Category;
