import express from 'express';
import { listarPedidosConcluidos, obterDetalhesPedido } from '../controllers/pedidoDeVendaController.js';

const router = express.Router();

router.get('/concluidos', listarPedidosConcluidos);
router.get('/:id/detalhes', obterDetalhesPedido);

export default router;
