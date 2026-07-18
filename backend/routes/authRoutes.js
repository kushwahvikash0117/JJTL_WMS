import express from 'express';
import { 
  registerUser, 
  loginUser, 
  sendOTP, 
  verifyOTP,
  resetPassword 
} from '../controllers/authController.js';

const router = express.Router();

router.post('/send-otp', sendOTP);      // Step 1: Send OTP to email
router.post('/verify-otp', verifyOTP);  // Step 2: Verify OTP
router.post('/register', registerUser); // Step 3: Register user
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);

export default router;