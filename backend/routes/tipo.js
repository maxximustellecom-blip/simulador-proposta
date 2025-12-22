import express from 'express';
import { listTypes, createType, updateType, deleteType } from '../controllers/tipoController.js';

const router = express.Router();

router.get('/', listTypes);
router.post('/', createType);
router.put('/:id', updateType);
router.delete('/:id', deleteType);

export default router;
