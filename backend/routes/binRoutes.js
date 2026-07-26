/**
 * @file binRoutes.js
 * @description Express router for bin and location management endpoints.
 */

import express from 'express';
import { createBin, getBinStatus, addBulkItems } from '../controllers/binController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, createBin);                    // Create a new bin
router.get('/barcode/:barcode', auth, getBinStatus);  // Get bin details by barcode
router.post('/location', auth, addBulkItems);         // Add items in bulk to a bin

export default router;