/**
 * @file Item.js
 * @description Mongoose schema and model for warehouse inventory items.
 */

import mongoose from 'mongoose';

/**
 * Schema representing an inventory item along with its tracking, location, and history details.
 */
const itemSchema = new mongoose.Schema({
  buyer: { type: String, required: true }, 
  poNo: { type: String, required: true }, 
  lot: { type: String, required: true }, 
  element: { type: String, required: true, unique: true },
  productDescription: String, 
  initialQuantity: Number, 
  currentQuantity: Number, 
  netWeight: Number, 
  grossWeight: Number, 
  length: Number, 
  breadth: Number, 
  height: Number,
  
  // Legacy field maintained for backwards compatibility
  batches: String, 
  
  rollNo: { type: String, required: true, unique: true }, // Serves as the primary barcode
  
  // Source File Tracking
  packingList: { 
    type: String, 
    default: 'Packing list' 
  },
  
  // Location Tracking fields
  currentBin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', default: null },
  locationBarcode: { type: String, default: null }, 
  locationName: { type: String, default: null },   
  
  // Lifecycle timestamp trackers
  createdAt: { type: Date, default: Date.now },    
  itemEntered: { type: Date, default: null },        

  // History tracking for quantity updates
  updateHistory: [
    {
      timestamp: { type: Date, default: Date.now },
      batchNo: { type: String, required: true },
      quantityGone: { type: Number, required: true } 
    }
  ],

  // Tracking details for item exit workflow
  exitDetails: {
    batchNo: { type: String, default: null },
    timestamp: { type: Date, default: null }
  },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);
