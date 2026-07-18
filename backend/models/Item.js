import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  // Core fields from your new AddItem.jsx form
  buyer: { type: String, required: true },
  poNo: { type: String, required: true },
  location: { type: String, required: true },
  productDescription: { type: String },
  lot: { type: String, required: true },
  element: { type: String },
  qty: { type: Number, required: true }, // Kgs
  netWeight: { type: Number, required: true }, // Kgs
  grossWeight: { type: Number, required: true }, // Kgs
  length: { type: Number }, // cm
  breadth: { type: Number }, // cm
  height: { type: Number }, // cm
  
  // System-generated fields
  rollNo: { type: String, required: true, unique: true },
  barcode: { type: String, required: true, index: true },
  
  // Tracking fields
  date: { type: Date, default: Date.now },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);