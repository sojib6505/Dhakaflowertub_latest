import express from 'express';
import { getCategories, updateCategory } from '../controllers/categoryController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Exactly four categories exist: there is intentionally no create or delete route.
router.get('/', getCategories);
router.put('/:key', requireAdmin, updateCategory);

export default router;
