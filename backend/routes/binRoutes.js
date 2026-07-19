import express from 'express';
import { createBin, getBinStatus } from '../controllers/binController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Manually create a new bin
router.post('/', auth, createBin);

// Get status/details of a bin by scanning its barcode
router.get('/:barcode', auth, getBinStatus);

export default router;