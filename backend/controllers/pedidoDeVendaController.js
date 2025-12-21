import { PedidoDeVenda, Negotiation, NegociacaoProposta, NegociacaoPropostaCustomizada, Client } from '../models/index.js';
import { Op } from 'sequelize';

export async function obterDetalhesPedido(req, res) {
  try {
    const { id } = req.params;
    const pedido = await PedidoDeVenda.findByPk(id, {
      include: [
        {
          model: Negotiation,
          as: 'negotiation',
          include: [
            { model: NegociacaoProposta, as: 'proposal' },
            { model: NegociacaoPropostaCustomizada, as: 'customProposal' },
            { model: Client, as: 'client' }
          ]
        }
      ]
    });

    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }

    if (!pedido.negotiation) {
      return res.status(404).json({ error: 'Negociação não encontrada para este pedido' });
    }

    let linhas = [];
    const tipo = pedido.negotiation.tipo;

    if (pedido.negotiation.proposal) {
      linhas = pedido.negotiation.proposal.linhas || [];
    } else if (pedido.negotiation.customProposal) {
      linhas = pedido.negotiation.customProposal.linhas || [];
    }

    return res.json({
      id: pedido.id,
      tipo: tipo,
      razaoSocial: pedido.negotiation.client?.name || '',
      cnpj: pedido.negotiation.cnpj || '',
      linhas: linhas
    });
  } catch (error) {
    console.error('Erro ao obter detalhes do pedido:', error);
    return res.status(500).json({ error: 'Erro interno ao obter detalhes do pedido.' });
  }
}

export async function listarPedidosConcluidos(req, res) {
  try {
    const pedidos = await PedidoDeVenda.findAll({
      include: [
        {
          model: Negotiation,
          as: 'negotiation',
          where: {
            status: {
              [Op.or]: ['Concluído', 'Concluido', 'CONCLUÍDO', 'CONCLUIDO', 'Concluída'] // Handling potential case/accent differences
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
