import Item from '../models/Item.js';
import { createLog } from './logController.js';

// ADD ITEM (IN)
export const addItem = async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, createdBy: req.user.id });
    await createLog(item._id, 'IN', req.user.id, null, item, "New item addition");
    res.status(201).json(item);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// GET ITEM BY BARCODE
export const getItemByBarcode = async (req, res) => {
  try {
    const item = await Item.findOne({ barcode: req.params.barcode });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ALL ITEMS (For Warehouse Page)
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// UPDATE ITEM (With Audit Log)
export const updateItem = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get old data for audit trail
    const oldItem = await Item.findById(id);
    if (!oldItem) return res.status(404).json({ error: "Item not found" });

    // Update item
    const updatedItem = await Item.findByIdAndUpdate(
      id,
      { ...req.body, updatedBy: req.user.id },
      { new: true }
    );

    // Create Audit Log entry
    await createLog(
      id, 
      'UPDATE', 
      req.user.id, 
      oldItem, 
      updatedItem, 
      "Item details updated"
    );

    res.json(updatedItem);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// REMOVE ITEM (OUT)
export const removeItem = async (req, res) => {
  try {
    const item = await Item.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    
    await createLog(req.params.id, 'OUT', req.user.id, item, null, "Item removed from warehouse");
    res.json({ message: "Item removed successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
