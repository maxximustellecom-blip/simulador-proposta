import express from 'express';
import multer from 'multer';
import { listCustomProducts, createCustomProduct, updateCustomProduct, deleteCustomProduct, exportCustomProducts, importCustomProducts } from '../controllers/customProductController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

router.get('/', listCustomProducts);
router.get('/export', exportCustomProducts);
router.post('/import', upload.single('file'), importCustomProducts);
router.post('/', createCustomProduct);
router.put('/:id', updateCustomProduct);
router.delete('/:id', deleteCustomProduct);

export default router;
