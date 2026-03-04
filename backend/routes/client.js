import express from 'express';
import { upsertClient, updateClient, getClients, deleteClient } from '../controllers/clientController.js';

const router = express.Router();

router.post('/', upsertClient);
router.put('/:id', updateClient);
router.get('/', getClients);
router.delete('/:id', deleteClient);

export default router;
