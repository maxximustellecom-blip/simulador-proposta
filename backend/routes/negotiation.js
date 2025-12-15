import express from 'express';
import { listNegotiations, createNegotiation, updateNegotiation, deleteNegotiation } from '../controllers/negotiationController.js';

const router = express.Router();

router.get('/', listNegotiations);
router.post('/', createNegotiation);
router.put('/:id', updateNegotiation);
router.delete('/:id', deleteNegotiation);

export default router;

