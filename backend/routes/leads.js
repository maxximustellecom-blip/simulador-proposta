import express from 'express';
import multer from 'multer';
import { importLeads, listBatches, getBatchDetail, deleteBatch, listAllLeads, updateLead } from '../controllers/leadsController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

router.post('/import', upload.single('file'), importLeads);
router.get('/batches', listBatches);
router.get('/mine', listAllLeads); // Nova rota para listar leads do usuário
router.get('/batches/:id', getBatchDetail);
router.delete('/batches/:id', deleteBatch);
router.put('/:id', updateLead);

export default router;

