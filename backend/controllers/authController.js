import User from '../models/User.js';
import OTP from '../models/OTP.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { sendOTPEmail } from '../services/otpService.js';

// 1. SEND OTP
export const sendOTP = async (req, res) => {
  try {
    const { email } = req.body;
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // 6 digit code
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 mins expiry

    await OTP.findOneAndUpdate({ email }, { otp, expiresAt }, { upsert: true });
    await sendOTPEmail(email, otp);
    
    res.json({ message: "OTP sent to your email" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 2. VERIFY OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const record = await OTP.findOne({ email, otp });
    
    if (!record || record.expiresAt < Date.now()) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }
    
    res.json({ message: "OTP verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 3. REGISTER USER (After Verification)
export const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword, isVerified: true });
    
    await OTP.deleteOne({ email }); // Clear OTP after registration
    res.status(201).json({ message: "Account created successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });
    res.json({ token, user: { name: user.name, email: user.email } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// 4. RESET PASSWORD (Change Password)
export const resetPassword = async (req, res) => {
  try {
    const { email, password } = req.body;

    // 1. Check if the OTP was verified (Optional: Add a flag in OTP model or rely on session)
    // Here we assume this is called after verifyOTP succeeds
    
    // 2. Hash the new password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 3. Update the user password
    const user = await User.findOneAndUpdate(
      { email }, 
      { password: hashedPassword },
      { new: true }
    );

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // 4. Clear the OTP record after successful reset
    await OTP.deleteOne({ email });

    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
