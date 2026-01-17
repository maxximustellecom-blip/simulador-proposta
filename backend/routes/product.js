import express from 'express';
import multer from 'multer';
import { listProducts, createProduct, updateProduct, deleteProduct, exportProducts, importProducts } from '../controllers/productController.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 }
});

const router = express.Router();

router.get('/', listProducts);
router.get('/export', exportProducts);
router.post('/import', upload.single('file'), importProducts);
router.post('/', createProduct);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

export default router;
