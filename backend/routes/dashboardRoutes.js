import express from 'express';
import { getWarehouseStats } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

// Route to get all dashboard statistics
router.get('/stats', auth, getWarehouseStats);

export default router;