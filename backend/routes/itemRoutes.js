import express from 'express';
import { 
  addItem, 
  getItemByBarcode, 
  getAllItems, 
  updateItem, 
  removeItem 
} from '../controllers/itemController.js';
import { auth } from '../middleware/auth.js';

const router = express.Router();

router.post('/', auth, addItem);
router.get('/', auth, getAllItems);
router.get('/:barcode', auth, getItemByBarcode);
router.put('/:id', auth, updateItem);
router.delete('/:id', auth, removeItem);

export default router;