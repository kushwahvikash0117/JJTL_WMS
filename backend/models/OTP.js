/**
 * @file OTP.js
 * @description Mongoose schema and model for One-Time Passwords (OTPs) with TTL index support.
 */

import mongoose from 'mongoose';

/**
 * Schema representing temporary OTP codes for user authentication and password resets.
 */
const otpSchema = new mongoose.Schema({
  email: { type: String, required: true },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true }
});

// TTL Index: Automatically removes the OTP document from the database once it expires
otpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export default mongoose.model('OTP', otpSchema);