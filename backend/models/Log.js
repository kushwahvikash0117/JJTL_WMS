import mongoose from 'mongoose';

const logSchema = new mongoose.Schema({
  itemId: { type: mongoose.Schema.Types.ObjectId, ref: 'Item', required: true },
  action: { type: String, enum: ['IN', 'UPDATE', 'OUT', 'DELETE'], required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  oldData: { type: Object, default: null }, // Snapshot before change
  newData: { type: Object, default: null }, // Snapshot after change
  remarks: { type: String }
}, { timestamps: true });

export default mongoose.model('Log', logSchema);