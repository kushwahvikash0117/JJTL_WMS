import express from 'express';
import { getLogs } from '../controllers/logController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.get('/', auth, getLogs);

export default router;