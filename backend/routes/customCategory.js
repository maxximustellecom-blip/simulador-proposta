import express from 'express';
import { listCustomCategories, createCustomCategory, updateCustomCategory, deleteCustomCategory } from '../controllers/customCategoryController.js';

const router = express.Router();

router.get('/', listCustomCategories);
router.post('/', createCustomCategory);
router.put('/:id', updateCustomCategory);
router.delete('/:id', deleteCustomCategory);

export default router;

