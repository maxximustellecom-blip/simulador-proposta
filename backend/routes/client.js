import express from 'express';
import { upsertClient, getClients, deleteClient } from '../controllers/clientController.js';

const router = express.Router();

router.post('/', upsertClient);
router.get('/', getClients);
router.delete('/:id', deleteClient);

export default router;
