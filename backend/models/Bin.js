import mongoose from 'mongoose';

const binSchema = new mongoose.Schema({
  locationBarcode: { type: String, required: true, unique: true },
  locationName: { type: String, required: true },
  items: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Item' }]
}, { timestamps: true });

export default mongoose.model('Bin', binSchema);