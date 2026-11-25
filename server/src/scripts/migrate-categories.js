/**
 * migrate-categories.js
 *
 * Safe, repeatable migration script for the category system change.
 *
 * What it does:
 *  1. Ensures all 5 new categories exist in the Category collection.
 *  2. For every product that has NOT yet been assigned to a new-style `categories` array:
 *       - Preserves the original `category` string in `legacyCategory`.
 *       - Sets `categories: []` (empty — awaiting manual reassignment).
 *  3. For products that already have a populated `categories` array, it does NOT touch them.
 *  4. Prints a report of all products that need manual category assignment.
 *
 * Usage:
 *   node server/src/scripts/migrate-categories.js
 *
 * Run from the project root or server directory (adjust .env path accordingly).
 * The script is SAFE to run multiple times — it will never overwrite an already
 * migrated product's categories.
 */

import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../..', '.env') });
dotenv.config({ path: join(__dirname, '../../', '.env') });

// ---- Inline schema to avoid circular import issues ----
const CATEGORY_KEYS = ['planters-tub', 'planter-sets', 'plants', 'landscaping', 'essentials-services'];

const DEFAULT_CATEGORIES = [
  { key: 'planters-tub', name: 'Planters & Tub', description: 'Decorative planters and premium tubs', sortOrder: 1 },
  { key: 'planter-sets', name: 'Planter Sets', description: 'Beautifully curated planter combinations', sortOrder: 2 },
  { key: 'plants', name: 'Plants', description: 'Indoor, outdoor and decorative plants', sortOrder: 3 },
  { key: 'landscaping', name: 'Landscaping', description: 'Landscape design and greenery solutions', sortOrder: 4 },
  { key: 'essentials-services', name: 'Essentials & Services', description: 'Gardening essentials and related services', sortOrder: 5 }
];

const categorySchema = new mongoose.Schema({
  key: { type: String, required: true, unique: true, immutable: true },
  name: { type: String, required: true, trim: true, maxlength: 40 },
  description: { type: String, trim: true, default: '', maxlength: 120 },
  sortOrder: { type: Number, default: 0 }
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: String,
  slug: String,
  // Old field (may exist in legacy records)
  category: { type: String, trim: true },
  // New multi-category field
  categories: { type: [String], default: [] },
  // Preserved old value
  legacyCategory: { type: String, trim: true }
}, { strict: false, timestamps: true });

const run = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dhakaflowertub';
  console.log(`\nConnecting to MongoDB: ${uri}\n`);

  await mongoose.connect(uri);
  console.log('Connected.\n');

  const Category = mongoose.model('Category', categorySchema);
  const Product = mongoose.model('Product', productSchema);

  // 1. Ensure all 5 categories exist
  console.log('Step 1: Ensuring new categories exist...');
  for (const cat of DEFAULT_CATEGORIES) {
    const existing = await Category.findOne({ key: cat.key });
    if (!existing) {
      await Category.create(cat);
      console.log(`  Created category: ${cat.key}`);
    } else {
      console.log(`  Category already exists: ${cat.key}`);
    }
  }

  // Also remove old category documents that are no longer valid keys
  const oldCategoryDocs = await Category.find({ key: { $nin: CATEGORY_KEYS } });
  if (oldCategoryDocs.length > 0) {
    console.log(`\n  Found ${oldCategoryDocs.length} old category document(s) with deprecated keys:`);
    for (const doc of oldCategoryDocs) {
      console.log(`    - ${doc.key} (${doc.name})`);
    }
    console.log('  These are left in place. You may delete them manually if desired.');
  }

  // 2. Find products that need migration
  //    "Needs migration" = has no categories array OR categories array is empty
  console.log('\nStep 2: Finding products that need category migration...');
  const needsMigration = await Product.find({
    $or: [
      { categories: { $exists: false } },
      { categories: { $size: 0 } },
      { categories: null }
    ]
  }).lean();

  console.log(`  Found ${needsMigration.length} product(s) needing migration.\n`);

  if (needsMigration.length === 0) {
    console.log('Nothing to migrate. All products already have categories assigned.\n');
    await mongoose.disconnect();
    process.exit(0);
  }

  // 3. Migrate: preserve legacyCategory, set categories to []
  const bulkOps = needsMigration.map((product) => ({
    updateOne: {
      filter: { _id: product._id },
      update: {
        $set: {
          categories: [],
          // Preserve the old category value in legacyCategory (if it has one)
          ...(product.category && !product.legacyCategory
            ? { legacyCategory: String(product.category) }
            : {})
        }
      }
    }
  }));

  if (bulkOps.length > 0) {
    await Product.bulkWrite(bulkOps, { ordered: false });
  }

  console.log(`Step 3: Migrated ${bulkOps.length} product(s). Their old category value is preserved in legacyCategory.\n`);

  // 4. Print the manual reassignment report
  const reportProducts = await Product.find({ categories: { $size: 0 } }).select('name slug legacyCategory').lean();

  if (reportProducts.length > 0) {
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  MANUAL REASSIGNMENT REQUIRED');
    console.log('  The following products have no assigned categories.');
    console.log('  Their old category value is shown in brackets.');
    console.log('  Please assign them to new categories via the Admin Dashboard.');
    console.log('═══════════════════════════════════════════════════════════════');
    for (const p of reportProducts) {
      const legacy = p.legacyCategory ? `[was: ${p.legacyCategory}]` : '[no previous category]';
      console.log(`  • ${p.name} (${p.slug}) ${legacy}`);
    }
    console.log('═══════════════════════════════════════════════════════════════\n');
  }

  console.log('Migration complete.\n');
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
