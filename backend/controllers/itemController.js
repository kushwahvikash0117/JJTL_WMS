/**
 * @file itemController.js
 * @description Handles inventory item operations (creation, retrieval, allocation, exit, and updates).
 */

import Item from '../models/Item.js';
import Bin from '../models/Bin.js';
import { createLog } from './logController.js';

/**
 * Creates a new inventory item and logs the action.
 */
export const addItem = async (req, res) => {
  try {
    const item = await Item.create({ ...req.body, barcode: req.body.rollNo });
    
    await createLog(item._id, 'ADD', req.user.id, null, item, "New item addition to packing list");
    
    res.status(201).json(item);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

/**
 * Fetches all inventory items populated with current bin data.
 */
export const getAllItems = async (req, res) => {
  try {
    const items = await Item.find().populate('currentBin', 'locationName locationBarcode').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Retrieves a single item by its roll number/barcode.
 */
export const getItemByBarcode = async (req, res) => {
  try {
    const item = await Item.findOne({ rollNo: req.params.barcode }).populate('currentBin');
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Retrieves a single item by its element identifier.
 */
export const getItemByElement = async (req, res) => {
  try {
    const item = await Item.findOne({ element: req.params.element }).populate('currentBin');
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(item);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Allocates an item to a specific storage location/bin and logs the action.
 */
export const entryItem = async (req, res) => {
  try {
    const { itemId, locationBarcode, locationName } = req.body;

    if (!locationName || locationName.trim() === "") {
      return res.status(400).json({ error: "Invalid location: locationName is required and cannot be empty." });
    }

    const existingItemBefore = await Item.findById(itemId);
    if (!existingItemBefore) {
      return res.status(404).json({ error: "Item not found in database" });
    }

    const bin = await Bin.findOneAndUpdate(
      { locationBarcode },
      { $setOnInsert: { locationBarcode, locationName } },
      { new: true, upsert: true }
    );

    const updatedItem = await Item.findByIdAndUpdate(
      itemId, 
      { 
        $set: {
          currentBin: bin._id,
          locationBarcode: locationBarcode,
          locationName: bin.locationName,
          itemEntered: new Date()
        }
      },
      { new: true, runValidators: true }
    );

    await Bin.findByIdAndUpdate(bin._id, { $addToSet: { items: itemId } });
    
    await createLog(
      itemId, 
      'ALLOCATE', 
      req.user.id, 
      existingItemBefore, 
      updatedItem, 
      `Location allocated: ${bin.locationName} (${locationBarcode})`
    );

    res.json({ message: "Success", item: updatedItem });
  } catch (err) { 
    console.error("Backend Error:", err);
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Removes an item from its current bin location and records its exit.
 */
export const exitItem = async (req, res) => {
  try {
    const { itemId, batch } = req.body;
    const item = await Item.findById(itemId);
    
    if (!item) return res.status(404).json({ error: "Item not found" });

    if (item.currentBin) {
      await Bin.findByIdAndUpdate(item.currentBin, { $pull: { items: itemId } });
    }

    const updatedItem = await Item.findByIdAndUpdate(itemId, { 
      $set: { 
        currentBin: null, 
        locationBarcode: null, 
        locationName: null,
        batches: batch,
        exitDetails: {
          batchNo: batch,
          timestamp: new Date()
        }
      }
    }, { new: true });

    await createLog(itemId, 'EXIT', req.user.id, item, updatedItem, `Item exited warehouse. Batch: ${batch}`);
    
    res.json({ message: "Item exited", item: updatedItem });
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

/**
 * Updates an item's quantity details, tracking changes in update history.
 */
export const updateItem = async (req, res) => {
  try {
    const { qty, batchNo } = req.body;
    
    if (qty === undefined) {
      return res.status(400).json({ error: "Quantity is required" });
    }

    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    const originalQty = existingItem.qty || 0;
    const newQty = Number(qty);
    const quantityGone = originalQty - newQty;

    const updateData = {
      qty: newQty, 
      netWeight: newQty, 
      grossWeight: newQty 
    };

    let updateQuery = { $set: updateData };
    
    if (batchNo) {
      updateQuery.$push = {
        updateHistory: {
          timestamp: new Date(),
          batchNo: batchNo,
          quantityGone: quantityGone
        }
      };
    }

    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id, 
      updateQuery, 
      { new: true }
    );

    await createLog(
      req.params.id, 
      'UPDATE', 
      req.user.id, 
      existingItem, 
      updatedItem, 
      `Item quantity updated. Issued: ${quantityGone} (Batch: ${batchNo || 'N/A'})`
    );

    res.json(updatedItem);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};