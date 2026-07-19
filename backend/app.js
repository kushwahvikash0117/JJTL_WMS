import express from 'express';
import cors from 'cors';
import authRoutes from './routes/authRoutes.js';
import itemRoutes from './routes/itemRoutes.js';
import logRoutes from './routes/logRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import binRoutes from './routes/binRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/items', itemRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/bins', binRoutes);

// Health Check
app.get('/', (req, res) => {
  res.status(200).json({ message: 'JJTL Warehouse Management System API is healthy' });
});

// Centralized Error Handling
app.use(errorHandler);

export default app;