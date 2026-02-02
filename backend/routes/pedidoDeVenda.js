import express from 'express';
import { listarPedidosConcluidos, obterDetalhesPedido, atualizarPedidoDeVenda } from '../controllers/pedidoDeVendaController.js';

const router = express.Router();

router.get('/concluidos', listarPedidosConcluidos);
router.get('/:id/detalhes', obterDetalhesPedido);
router.put('/:id', atualizarPedidoDeVenda);

export default router;
