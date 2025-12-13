import express from 'express';
import { updateSale, deleteSale, listSales } from '../controllers/saleController.js';

const router = express.Router();

router.get('/', listSales);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router;
