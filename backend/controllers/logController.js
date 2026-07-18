import Log from '../models/Log.js';

// Reusable function for internal calls
export const createLog = async (itemId, action, performedBy, oldData, newData, remarks) => {
  try {
    await Log.create({ itemId, action, performedBy, oldData, newData, remarks });
  } catch (err) {
    console.error("Failed to create log:", err.message);
  }
};

// API endpoint to get logs with complete details
export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate({
        path: 'itemId',
        select: 'barcode poNo customer location productDescription qty'
      })
      .populate({
        path: 'performedBy',
        select: 'name email'
      })
      .sort({ createdAt: -1 }); // Newest first

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};