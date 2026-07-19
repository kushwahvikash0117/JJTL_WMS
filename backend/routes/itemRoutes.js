import express from 'express';
import { addItem, getAllItems, getItemByBarcode, getItemByElement, entryItem, updateItem, exitItem } from '../controllers/itemController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, addItem);
router.get('/', auth, getAllItems); 

// Use prefixes to differentiate between search types
router.get('/barcode/:barcode', auth, getItemByBarcode);
router.get('/element/:element', auth, getItemByElement);

router.post('/entry', auth, entryItem); 
router.put('/:id', auth, updateItem);   
router.post('/exit', auth, exitItem);

export default router;