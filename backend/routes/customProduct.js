import express from 'express';
import { listCustomProducts, createCustomProduct, updateCustomProduct, deleteCustomProduct } from '../controllers/customProductController.js';

const router = express.Router();

router.get('/', listCustomProducts);
router.post('/', createCustomProduct);
router.put('/:id', updateCustomProduct);
router.delete('/:id', deleteCustomProduct);

export default router;

