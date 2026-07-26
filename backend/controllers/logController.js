/**
 * @file logController.js
 * @description Handles creation and retrieval of system audit logs.
 */

import Log from '../models/Log.js';

/**
 * Creates and saves an audit log entry.
 */
export const createLog = async (itemId, action, performedBy, oldData, newData, remarks) => {
  try {
    await Log.create({ itemId, action, performedBy, oldData, newData, remarks });
  } catch (err) {
    console.error("Failed to create log:", err.message);
  }
};

/**
 * Fetches all logs with populated item and user details, sorted by newest first.
 */
export const getLogs = async (req, res) => {
  try {
    const logs = await Log.find()
      .populate({
        path: 'itemId',
        select: 'element poNo buyer locationName locationBarcode qty lot rollNo length breadth height netWeight grossWeight productDescription'
      })
      .populate({
        path: 'performedBy',
        select: 'name email'
      })
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};