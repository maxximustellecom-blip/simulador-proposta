import express from 'express';
import { listNegotiations, createNegotiation, updateNegotiation, deleteNegotiation } from '../controllers/negotiationController.js';
import { getProposalForNegotiation, saveProposalForNegotiation } from '../controllers/negotiationProposalController.js';
import { getCustomProposalForNegotiation, saveCustomProposalForNegotiation } from '../controllers/negotiationCustomProposalController.js';

const router = express.Router();

router.get('/', listNegotiations);
router.post('/', createNegotiation);
router.put('/:id', updateNegotiation);
router.delete('/:id', deleteNegotiation);
router.get('/:id/proposal', getProposalForNegotiation);
router.post('/:id/proposal', saveProposalForNegotiation);
router.get('/:id/custom-proposal', getCustomProposalForNegotiation);
router.post('/:id/custom-proposal', saveCustomProposalForNegotiation);

export default router;
