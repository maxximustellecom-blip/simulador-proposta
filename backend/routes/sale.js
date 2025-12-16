import express from 'express';
import { updateSale, deleteSale, listSales, listSalesFromNegotiations } from '../controllers/saleController.js';

const router = express.Router();

router.get('/', listSales);
router.get('/negotiations', listSalesFromNegotiations);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router;
