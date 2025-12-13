import express from 'express';
import { createSimulation, listSimulations } from '../controllers/simulationController.js';

const router = express.Router();

router.post('/', createSimulation);
router.get('/', listSimulations);

export default router;
