/**
 * @file Log.js
 * @description Mongoose schema and model for audit logs.
 */

import mongoose from 'mongoose';

/**
 * Schema representing an audit log entry for tracking item changes.
 */
const logSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  action: { type: String, enum: ['ADD', 'ALLOCATE', 'UPDATE', 'EXIT'], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldData: { type: Object, default: null }, 
  newData: { type: Object, default: null }, 
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model('Log', logSchema);