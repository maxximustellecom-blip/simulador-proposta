import express from 'express';
import * as regiaoController from '../controllers/regiaoController.js';

const router = express.Router();

router.get('/', regiaoController.getAll);
router.post('/', regiaoController.create);
router.put('/:id', regiaoController.update);
router.delete('/:id', regiaoController.remove);

export default router;
