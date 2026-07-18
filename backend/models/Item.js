import mongoose from 'mongoose';

const itemSchema = new mongoose.Schema({
  location: { type: String, required: true }, // e.g., 01-01-01
  poNo: { type: String, required: true },
  customer: { type: String, required: true },
  color: { type: String, required: true },
  productDescription: { type: String },
  siliconFinishQuality: { type: String },
  grade: { type: String },
  netWeight: { type: Number },
  lotNo: { type: String, required: true },
  rollNo: { type: String, required: true },
  processType: { type: String },
  gsm: { type: Number },
  grossWeight: { type: Number },
  qty: { type: Number, required: true },
  actualWidth: { type: String },
  finishType: { type: String },
  date: { type: Date, default: Date.now },
  barcode: { type: String, required: true, index: true }, // Unique physical barcode
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('Item', itemSchema);