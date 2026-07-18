import Item from '../models/Item.js';
import User from '../models/User.js'; // Ensure you import your User model

export const getWarehouseStats = async (req, res) => {
  try {
    // 1. Total Items
    const totalItems = await Item.countDocuments();

    // 2. Active P.O.s (Unique count of poNo)
    const activePO = await Item.distinct('poNo').then(po => po.length);

    // 3. Low Stock Alerts (Assuming qty < 10 is low stock)
    const lowStockAlerts = await Item.countDocuments({ qty: { $lt: 10 } });

    // 4. System Users
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