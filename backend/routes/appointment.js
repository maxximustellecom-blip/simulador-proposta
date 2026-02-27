import express from 'express';
import { list, create, remove } from '../controllers/appointmentController.js';

const router = express.Router();

router.get('/', list);
router.post('/', create);
router.delete('/:id', remove);

export default router;
