import Bin from '../models/Bin.js';
import { binMapping } from '../config/binMapping.js';

// CREATE/INITIALIZE BIN (Supports both manual creation and auto-init from mapping)
// CREATE/INITIALIZE BIN
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