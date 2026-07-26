/**
 * @file authRoutes.js
 * @description Express router for authentication endpoints.
 */

import express from 'express';
import { 
  registerUser, 
  loginUser, 
  sendOTP, 
  verifyOTP,
  resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOTP);      // Send OTP to email
router.post('/verify-otp', verifyOTP);  // Verify OTP
router.post('/register', registerUser); // Register user
router.post('/login', loginUser);       // Authenticate user
router.post('/reset-password', resetPassword); // Reset user password

export default router;