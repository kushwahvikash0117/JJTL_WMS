import express from 'express';
import { createBin, getBinStatus, addBulkItems} from '../controllers/binController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Manually create a new bin
router.post('/', auth, createBin);

// Get status/details of a bin by scanning its barcode (added leading slash)
router.get('/barcode/:barcode', auth, getBinStatus);

// Add bulk items (changed from GET to POST since it accepts a request body)
router.post('/location', auth, addBulkItems);

export default router;