/**
 * @file itemController.js
 * @description Handles inventory item operations (creation, retrieval, allocation, exit, batch exit, and updates).
 */

import Item from '../models/Item.js';
import Bin from '../models/Bin.js';
import { createLog } from './logController.js';

/**
 * Creates a new inventory item and logs the action.
 */
export const addItem = async (req, res) => {
  try {
    const itemData = { 
      ...req.body, 
      barcode: req.body.rollNo,
      packingList: req.body.packingList || 'Packing list'
    };
    
    // Automatically assign initialQuantity to currentQuantity if provided from the frontend
    if (itemData.currentQuantity !== undefined && itemData.initialQuantity === undefined) {
      itemData.initialQuantity = itemData.currentQuantity;
    }

    const item = await Item.create(itemData);
    
    await createLog(item._id, 'ADD', req.user.id, null, item, `New item addition to ${item.packingList}`);
    
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
 * Allocates an item to a specific storage location/bin, unlinking it from any previous bin first, and logs the action.
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

    // If the item is already linked to a different bin, unlink it first
    if (existingItemBefore.currentBin) {
      await Bin.findByIdAndUpdate(existingItemBefore.currentBin, { $pull: { items: itemId } });
    }

    // Find or create the target bin location
    const bin = await Bin.findOneAndUpdate(
      { locationBarcode },
      { $setOnInsert: { locationBarcode, locationName } },
      { new: true, upsert: true }
    );

    // Update item with new bin reference and location info
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

    // Add item reference to the new bin's items array
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
 * Removes an item from its current bin location (deleting its reference from the Bin model) and records its exit.
 */
export const exitItem = async (req, res) => {
  try {
    const { itemId, batch } = req.body;
    const item = await Item.findById(itemId);
    
    if (!item) return res.status(404).json({ error: "Item not found" });

    // Remove the item from its current Bin model reference
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
 * Handles batch exit where a single batch number is applied to multiple scanned items to exit them from the warehouse.
 */
export const batchExitItems = async (req, res) => {
  try {
    const { itemIds, batchNo } = req.body;

    if (!batchNo || batchNo.trim() === "") {
      return res.status(400).json({ error: "Batch number is required for batch exit." });
    }

    if (!itemIds || !Array.isArray(itemIds) || itemIds.length === 0) {
      return res.status(400).json({ error: "No items provided for batch exit." });
    }

    const results = [];

    for (const itemId of itemIds) {
      const item = await Item.findById(itemId);
      if (!item) continue;

      // Remove the item from its current Bin model reference if present
      if (item.currentBin) {
        await Bin.findByIdAndUpdate(item.currentBin, { $pull: { items: itemId } });
      }

      const updatedItem = await Item.findByIdAndUpdate(itemId, {
        $set: {
          currentBin: null,
          locationBarcode: null,
          locationName: null,
          batches: batchNo,
          exitDetails: {
            batchNo: batchNo,
            timestamp: new Date()
          }
        }
      }, { new: true });

      await createLog(itemId, 'EXIT', req.user.id, item, updatedItem, `Item exited warehouse via batch exit. Batch: ${batchNo}`);
      results.push(updatedItem);
    }

    res.json({ message: "Batch exit successful", exitedCount: results.length, items: results });
  } catch (err) {
    console.error("Batch Exit Error:", err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Updates an item's quantity details, tracking changes in update history.
 */
export const updateItem = async (req, res) => {
  try {
    const { currentQuantity, batchNo, yarnLotNo, gsm } = req.body;
    
    if (currentQuantity === undefined) {
      return res.status(400).json({ error: "Current quantity is required" });
    }

    const existingItem = await Item.findById(req.params.id);
    if (!existingItem) {
      return res.status(404).json({ error: "Item not found" });
    }

    const originalQty = existingItem.currentQuantity || 0;
    const newQty = Number(currentQuantity);
    const quantityGone = originalQty - newQty;

    const updateData = {
      currentQuantity: newQty, 
      netWeight: newQty, 
      grossWeight: newQty 
    };

    if (yarnLotNo !== undefined) {
      updateData.yarnLotNo = yarnLotNo;
    }

    if (gsm !== undefined) {
      updateData.gsm = gsm !== '' ? Number(gsm) : null;
    }

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