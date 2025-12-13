import express from 'express';
import { upsertClient, getClients } from '../controllers/clientController.js';

const router = express.Router();

router.post('/', upsertClient);
router.get('/', getClients);

export default router;
