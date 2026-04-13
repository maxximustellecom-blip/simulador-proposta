import express from 'express';
import { updateSale, deleteSale, listSales, listSalesFromNegotiations, getQuadroVendas } from '../controllers/saleController.js';

const router = express.Router();

router.get('/', listSales);
router.get('/quadro', getQuadroVendas);
router.get('/negotiations', listSalesFromNegotiations);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

export default router;
