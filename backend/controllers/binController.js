/**
 * @file binController.js
 * @description Handles bin creation, status checks, and bulk item assignments.
 */

import Bin from '../models/Bin.js';
import Item from '../models/Item.js';
import { binMapping } from '../config/binMapping.js';

/**
 * Creates or initializes a new bin.
 */
export const createBin = async (req, res) => {
  try {
    const { locationBarcode, locationName } = req.body;
    
    const bin = await Bin.create({ 
      locationBarcode, 
      locationName: locationName || `Bin-${locationBarcode}` 
    });
    
    res.status(201).json(bin);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

/**
 * Fetches bin status from the database or mappings.
 */
export const getBinStatus = async (req, res) => {
  const { barcode } = req.params;

  try {
    let bin = await Bin.findOne({ locationBarcode: barcode }).populate('items');

    if (!bin && binMapping[barcode]) {
      bin = await Bin.create({
        locationBarcode: barcode,
        locationName: binMapping[barcode],
        items: []
      });
      bin = await Bin.findById(bin._id).populate('items');
    }

    if (!bin) return res.status(404).json({ error: "Location not found or not mapped" });

    res.json({
      locationName: bin.locationName,
      isEmpty: bin.items.length === 0,
      items: bin.items
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

/**
 * Adds multiple items to a specified bin in bulk.
 */
export const addBulkItems = async (req, res) => {
  const { locationBarcode, locationName, itemIdentifiers } = req.body; 

  try {
    if (!locationBarcode) {
      return res.status(400).json({ error: "Location barcode is required" });
    }

    let bin = await Bin.findOne({ locationBarcode });

    if (!bin) {
      const resolvedName = locationName || binMapping[locationBarcode] || `Bin-${locationBarcode}`;
      bin = await Bin.create({
        locationBarcode,
        locationName: resolvedName,
        items: []
      });
    }

    if (!itemIdentifiers || !Array.isArray(itemIdentifiers) || itemIdentifiers.length === 0) {
      return res.status(400).json({ error: "No items provided for bulk addition" });
    }

    const updatedItems = [];
    const failedItems = [];

    for (const identifier of itemIdentifiers) {
      let item = await Item.findOne({
        $or: [
          { rollNo: identifier }, 
          { element: identifier }, 
          { barcode: identifier }, 
          { _id: identifier.match(/^[0-9a-fA-F]{24}$/) ? identifier : null }
        ]
      });

      if (!item) {
        failedItems.push({ identifier, reason: "Item not found" });
        continue;
      }

      if (!bin.items.includes(item._id)) {
        bin.items.push(item._id);
      }

      item.locationBarcode = bin.locationBarcode;
      item.locationName = bin.locationName;
      await item.save();

      updatedItems.push(item);
    }

    await bin.save();

    res.status(200).json({
      message: "Bulk items processed successfully",
      bin: {
        locationBarcode: bin.locationBarcode,
        locationName: bin.locationName,
        totalItemsCount: bin.items.length
      },
      successfulUpdates: updatedItems.length,
      failedItems
    });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};