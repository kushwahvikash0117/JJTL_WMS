/**
 * @file Bin.js
 * @description Mongoose schema and model for warehouse bins/locations.
 */

import mongoose from 'mongoose';

/**
 * Schema representing storage bins within the warehouse.
 */
const binSchema = new mongoose.Schema({
  locationBarcode: { type: String, required: true, unique: true },
  locationName: { type: String, required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true });

export default mongoose.model('Bin', binSchema);