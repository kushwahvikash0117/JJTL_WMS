/**
 * @file itemRoutes.js
 * @description Express router for inventory item management and lifecycle operations.
 */

import express from 'express';
import { addItem, getAllItems, getItemByBarcode, getItemByElement, entryItem, updateItem, exitItem, batchExitItems } from '../controllers/itemController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, addItem);              // Create a new item
router.get('/', auth, getAllItems);           // Retrieve all items

// Search routes with explicit prefixes to prevent path conflicts
router.get('/barcode/:barcode', auth, getItemByBarcode);
router.get('/element/:element', auth, getItemByElement);

router.post('/entry', auth, entryItem);        // Allocate item to location
router.put('/:id', auth, updateItem);          // Update item details/quantity
router.post('/exit', auth, exitItem);          // Process item exit from warehouse
router.post('/batch-exit', auth, batchExitItems); // Process batch exit for multiple items

export default router;