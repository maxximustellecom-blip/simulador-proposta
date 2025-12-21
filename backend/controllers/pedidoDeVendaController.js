import { PedidoDeVenda, Negotiation } from '../models/index.js';
import { Op } from 'sequelize';

export async function listarPedidosConcluidos(req, res) {
  try {
    const pedidos = await PedidoDeVenda.findAll({
      include: [
        {
          model: Negotiation,
          as: 'negotiation',
          where: {
            status: {
              [Op.or]: ['Concluído', 'Concluido', 'CONCLUÍDO', 'CONCLUIDO'] // Handling potential case/accent differences
            }
          }
        }
      ],
      order: [['created_at', 'DESC']]
    });

    // Formatting the response to match what the frontend table likely expects
    const result = pedidos.map(p => ({
      id: p.id,
      negotiation_id: p.negotiation_id,
      cnpj: p.negotiation?.cnpj,
      tipo: p.negotiation?.tipo,
      proposta: p.negotiation?.proposta,
      valor: p.negotiation?.valor,
      status: p.negotiation?.status, // Or p.status if we want the order status
      data: p.negotiation?.data,
      created_at: p.created_at
    }));

    return res.json(result);
  } catch (error) {
    console.error('Erro ao listar pedidos concluídos:', error);
    return res.status(500).json({ error: 'Erro interno ao listar pedidos.' });
  }
}
