import express from 'express';
import { listNegotiations, createNegotiation, updateNegotiation, deleteNegotiation } from '../controllers/negotiationController.js';
import { getProposalForNegotiation, saveProposalForNegotiation } from '../controllers/negotiationProposalController.js';
import { getCustomProposalForNegotiation, saveCustomProposalForNegotiation } from '../controllers/negotiationCustomProposalController.js';
import { 
  listAttachments, uploadAttachment, deleteAttachment, getAttachmentContent,
  listCustomAttachments, uploadCustomAttachment, deleteCustomAttachment, getCustomAttachmentContent
} from '../controllers/attachmentController.js';

const router = express.Router();

router.get('/', listNegotiations);
router.post('/', createNegotiation);
router.put('/:id', updateNegotiation);
router.delete('/:id', deleteNegotiation);

router.get('/:id/proposal', getProposalForNegotiation);
router.post('/:id/proposal', saveProposalForNegotiation);

router.get('/:id/attachments', listAttachments);
router.post('/:id/attachments', uploadAttachment);
router.delete('/:id/attachments/:attachmentId', deleteAttachment);
router.get('/:id/attachments/:attachmentId/content', getAttachmentContent);

router.get('/:id/custom-proposal', getCustomProposalForNegotiation);
router.post('/:id/custom-proposal', saveCustomProposalForNegotiation);

router.get('/:id/custom-attachments', listCustomAttachments);
router.post('/:id/custom-attachments', uploadCustomAttachment);
router.delete('/:id/custom-attachments/:attachmentId', deleteCustomAttachment);
router.get('/:id/custom-attachments/:attachmentId/content', getCustomAttachmentContent);

export default router;
