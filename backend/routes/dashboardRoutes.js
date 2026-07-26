/**
 * @file dashboardRoutes.js
 * @description Express router for dashboard and analytics endpoints.
 */

import express from 'express';
import { getWarehouseStats } from '../controllers/dashboardController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/stats', auth, getWarehouseStats); // Retrieve warehouse statistics

export default router;