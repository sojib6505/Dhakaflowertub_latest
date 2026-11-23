import dotenv from 'dotenv';
import mongoose from 'mongoose';
import Product from '../models/Product.js';
import OfferPackage from '../models/OfferPackage.js';
import { ensureCategories } from '../controllers/categoryController.js';
import { seedProducts } from '../data/seedProducts.js';
import { seedOffers } from '../data/seedOffers.js';

dotenv.config();

const seed = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dhakaflowertub';
  console.log(`Connecting to MongoDB at: ${uri}...`);

  try {
    await mongoose.connect(uri);
    console.log('MongoDB connected for seeding.');

    // Creates any missing category without overwriting names/descriptions the admin has edited.
    await ensureCategories();

    console.log('Clearing existing products and offers...');
    await Product.deleteMany({});
    await OfferPackage.deleteMany({});

    console.log(`Inserting ${seedProducts.length} curated products...`);
    const inserted = await Product.insertMany(seedProducts);

    console.log(`Inserting ${seedOffers.length} curated offer packages...`);
    const insertedOffers = await OfferPackage.insertMany(seedOffers);

    console.log(`✓ Successfully seeded ${inserted.length} products and ${insertedOffers.length} offer packages to Dhaka Flower Tub database!`);
    process.exit(0);
  } catch (error) {
    console.error('Error during database seed:', error);
    process.exit(1);
  }
};

seed();
