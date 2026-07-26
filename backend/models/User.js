/**
 * @file User.js
 * @description Mongoose schema and model for system users.
 */

import mongoose from 'mongoose';

/**
 * Schema representing an application user with verification and credential details.
 */
const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  isVerified: { type: Boolean, default: false }
}, { timestamps: true });

export default mongoose.model('User', userSchema);