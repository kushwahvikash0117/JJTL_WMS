import Item from '../models/Item.js';
import Bin from '../models/Bin.js';
import { createLog } from './logController.js';

// ADD ITEM (IN)
export const addItem = async (req, res) => {
  try {
    // Barcode is simply the rollNo
    const item = await Item.create({ ...req.body, barcode: req.body.rollNo });
    await createLog(item._id, 'IN', req.user.id, null, item, "New item addition");
    res.status(201).json(item);
  } catch (err) { res.status(400).json({ error: err.message }); }
};

// GET ALL ITEMS (Elements)
export const getAllItems = async (req, res) => {
  try {
    // Populate currentBin to see location details in the list
    const items = await Item.find().populate('currentBin', 'locationName locationBarcode').sort({ createdAt: -1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET ITEM BY BARCODE (rollNo)
export const getItemByBarcode = async (req, res) => {
  try {
    const item = await Item.findOne({ rollNo: req.params.barcode }).populate('currentBin');
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json(item);
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const getItemByElement = async (req, res) => {
  try {
    // Searching by the 'element' field instead of 'rollNo'
    const item = await Item.findOne({ element: req.params.element }).populate('currentBin');
    
    if (!item) {
      return res.status(404).json({ error: "Item not found" });
    }
    
    res.json(item);
  } catch (err) { 
    res.status(500).json({ error: err.message }); 
  }
};

export const entryItem = async (req, res) => {
  try {
    const { itemId, locationBarcode, locationName } = req.body;

    console.log("Received Data:", { itemId, locationBarcode, locationName });

    // 1. Validation: Throw error if locationName is missing or null
    if (!locationName || locationName.trim() === "") {
      return res.status(400).json({ error: "Invalid location: locationName is required and cannot be empty." });
    }

    // 2. Bin Update/Create
    const bin = await Bin.findOneAndUpdate(
      { locationBarcode },
      { $setOnInsert: { locationBarcode, locationName } }, // Now guaranteed to be valid
      { new: true, upsert: true }
    );

    // 3. Item Update
    const updatedItem = await Item.findByIdAndUpdate(
      itemId, 
      { 
        $set: {
          currentBin: bin._id,
          locationBarcode: locationBarcode,
          locationName: bin.locationName
        }
      },
      { new: true, runValidators: true }
    );

    if (!updatedItem) {
      return res.status(404).json({ error: "Item not found in database" });
    }

    // 4. Bin items list update
    await Bin.findByIdAndUpdate(bin._id, { $addToSet: { items: itemId } });
    
    res.json({ message: "Success", item: updatedItem });
  } catch (err) { 
    console.error("Backend Error:", err);
    res.status(500).json({ error: err.message }); 
  }
};

export const exitItem = async (req, res) => {
  try {
    const { itemId, batch } = req.body;
    const item = await Item.findById(itemId);
    
    if (!item) return res.status(404).json({ error: "Item not found" });

    // 1. Remove from bin if it exists
    if (item.currentBin) {
      await Bin.findByIdAndUpdate(item.currentBin, { $pull: { items: itemId } });
    }

    // 2. Update item: clear location fields and set batch as a string
    const updatedItem = await Item.findByIdAndUpdate(itemId, { 
      $set: { 
        currentBin: null, 
        locationBarcode: null, 
        locationName: null,
        batches: batch // Directly setting the string value
      }
    }, { new: true });

    await createLog(itemId, 'OUT', req.user.id, item, updatedItem, `Item exited. Batch: ${batch}`);
    res.json({ message: "Item exited", item: updatedItem });
  } catch (err) { res.status(500).json({ error: err.message }); }
};

export const updateItem = async (req, res) => {
  try {
    const { qty } = req.body;
    
    // Validate qty
    if (qty === undefined) {
      return res.status(400).json({ error: "Quantity is required" });
    }

    // Update qty and set weights equal to qty
    const updatedItem = await Item.findByIdAndUpdate(
      req.params.id, 
      { 
        $set: { 
          qty: qty, 
          netWeight: qty, 
          grossWeight: qty 
        } 
      }, 
      { new: true }
    );

    if (!updatedItem) return res.status(404).json({ error: "Item not found" });

    await createLog(req.params.id, 'UPDATE', req.user.id, null, { qty }, "Item quantity and weights updated");
    res.json(updatedItem);
  } catch (err) { res.status(500).json({ error: err.message }); }
};