/**
 * @file dashboardController.js
 * @description Provides statistical data for the warehouse dashboard.
 */

import Item from '../models/Item.js';
import User from '../models/User.js';

/**
 * Retrieves overall warehouse statistics including total items, unique POs, low stock alerts, and user counts.
 */
export const getWarehouseStats = async (req, res) => {
  try {
    const totalItems = await Item.countDocuments();
    const activePO = await Item.distinct('poNo').then(po => po.length);
    const lowStockAlerts = await Item.countDocuments({ qty: { $lt: 10 } });
    const systemUsers = await User.countDocuments();

    res.json({ 
      totalItems, 
      activePO, 
      lowStockAlerts, 
      systemUsers 
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};