import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  buyer: String, 
  poNo: String, 
  lot: String, 
  element: String,
  productDescription: String, 
  qty: Number, 
  netWeight: Number, 
  grossWeight: Number, 
  length: Number, 
  breadth: Number, 
  height: Number,
  
  // Track batches where this roll has been issued
  batches: String, 
  
  rollNo: { type: String, required: true, unique: true }, // Used as Barcode
  
  // Location Tracking
  currentBin: { type: mongoose.Schema.Types.ObjectId, ref: 'Bin', default: null },
  locationBarcode: { type: String, default: null }, // Store the scanned barcode
  locationName: { type: String, default: null },    // Store the human-readable name
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);