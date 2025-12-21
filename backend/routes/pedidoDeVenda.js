import express from 'express';
import { listarPedidosConcluidos } from '../controllers/pedidoDeVendaController.js';

const router = express.Router();

router.get('/concluidos', listarPedidosConcluidos);

export default router;
