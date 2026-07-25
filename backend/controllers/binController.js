import Bin from '../models/Bin.js';
import Item from '../models/Item.js';
import { binMapping } from '../config/binMapping.js';

// CREATE/INITIALIZE BIN (Supports both manual creation and auto-init from mapping)
export const createBin = async (req, res) => {
  try {
    const { locationBarcode, locationName } = req.body;
    
    // Create the bin using the values provided by the request.
    // If locationName is not provided, it falls back to a default format.
    const bin = await Bin.create({ 
      locationBarcode, 
      locationName: locationName || `Bin-${locationBarcode}` 
    });
    
    res.status(201).json(bin);
  } catch (err) { 
    res.status(400).json({ error: err.message }); 
  }
};

// GET BIN STATUS (Checks Mapping + Database)
export const getBinStatus = async (req, res) => {
  const { barcode } = req.params;

  try {
    // 1. Try to find in DB
    let bin = await Bin.findOne({ locationBarcode: barcode }).populate('items');

    // 2. If not found in DB, check if it's a valid "fixed" bin in mapping
    if (!bin && binMapping[barcode]) {
      bin = await Bin.create({
        locationBarcode: barcode,
        locationName: binMapping[barcode],
        items: []
      });
      // Populate again after creation
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

// ADD BULK ITEMS TO A BIN (Finds/Creates bin, then maps scanned items sequentially)
export const addBulkItems = async (req, res) => {
  const { locationBarcode, locationName, itemIdentifiers } = req.body; 
  // itemIdentifiers can be an array of scanned strings (rollNo, element, or barcode)

  try {
    if (!locationBarcode) {
      return res.status(400).json({ error: "Location barcode is required" });
    }

    // 1. Find the location's bin, or create it if it doesn't exist
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

    // 2. Process items one by one
    for (const identifier of itemIdentifiers) {
      // Find item by rollNo, element, barcode, or ObjectId
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

      // 3. Add item to bin's items array if not already present
      if (!bin.items.includes(item._id)) {
        bin.items.push(item._id);
      }

      // 4. Update the item's info to contain the location's name and barcode
      item.locationBarcode = bin.locationBarcode;
      item.locationName = bin.locationName;
      await item.save();

      updatedItems.push(item);
    }

    // Save the updated bin state
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