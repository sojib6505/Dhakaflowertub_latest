import express from 'express';
import { signUpload } from '../controllers/uploadController.js';
import { requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/sign', requireAdmin, signUpload);

export default router;
