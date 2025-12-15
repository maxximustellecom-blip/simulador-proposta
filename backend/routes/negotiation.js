import express from 'express';
import { listNegotiations, createNegotiation, updateNegotiation, deleteNegotiation } from '../controllers/negotiationController.js';
import { getProposalForNegotiation, saveProposalForNegotiation } from '../controllers/negotiationProposalController.js';

const router = express.Router();

router.get('/', listNegotiations);
router.post('/', createNegotiation);
router.put('/:id', updateNegotiation);
router.delete('/:id', deleteNegotiation);
router.get('/:id/proposal', getProposalForNegotiation);
router.post('/:id/proposal', saveProposalForNegotiation);

export default router;
