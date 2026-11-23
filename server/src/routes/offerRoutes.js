import express from 'express';
import {
  getOfferPackages,
  getOfferPackageBySlugOrId,
  createOfferPackage,
  updateOfferPackage,
  deleteOfferPackage
} from '../controllers/offerController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.route('/')
  .get(getOfferPackages)
  .post(requireAdmin, createOfferPackage);

router.route('/:slugOrId')
  .get(getOfferPackageBySlugOrId)
  .put(requireAdmin, updateOfferPackage)
  .delete(requireAdmin, deleteOfferPackage);

export default router;
