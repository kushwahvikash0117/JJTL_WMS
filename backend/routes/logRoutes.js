/**
 * @file logRoutes.js
 * @description Express router for retrieving system audit logs.
 */

import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getLogs); // Retrieve all audit logs

export default router;