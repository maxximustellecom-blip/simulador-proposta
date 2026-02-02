import { PedidoDeVenda, Negotiation, NegociacaoProposta, NegociacaoPropostaCustomizada, Client, User } from '../models/index.js';
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
            { model: Client, as: 'client' },
            { model: User, as: 'creator' }
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
      status: pedido.status || '',
      numP2B: pedido.num_p2b || '',
      numRadar: pedido.num_radar || '',
      dataEntrada: pedido.data_entrada || '',
      dataInput: pedido.data_input || '',
      dataAtivacao: pedido.data_ativacao || '',
      consultor: pedido.negotiation.creator?.name || '',
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
          include: [
            { model: Client, as: 'client' },
            { model: User, as: 'creator' },
            { model: NegociacaoProposta, as: 'proposal' },
            { model: NegociacaoPropostaCustomizada, as: 'customProposal' }
          ],
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
    const result = pedidos.map(p => {
      
      const neg = p.negotiation || {};
      const prop = neg.proposal || null;
      const cust = neg.customProposal || null;
      let totalAcessos = 0;
      if (prop && prop.total_acessos !== undefined && prop.total_acessos !== null) {
        totalAcessos = Number(prop.total_acessos || 0);
      } else if (cust && cust.total_acessos !== undefined && cust.total_acessos !== null) {
        totalAcessos = Number(cust.total_acessos || 0);
      } else {
        const linhas = (prop && Array.isArray(prop.linhas)) ? prop.linhas
                      : (cust && Array.isArray(cust.linhas)) ? cust.linhas
                      : [];
        totalAcessos = linhas.reduce((sum, l) => {
          const q = Number(l && l.quantidade !== undefined ? l.quantidade : 1);
          return sum + (isFinite(q) ? q : 1);
        }, 0);
      }
      return {
        id: p.id,
        negotiation_id: p.negotiation_id,
        consultor: neg.creator?.name || '',
        razaoSocial: neg.client?.name || '',
        cnpj: neg.cnpj,
        tipo: neg.tipo,
        numP2B: p.num_p2b || '',
        numRadar: p.num_radar || '',
        dataEntrada: p.data_entrada || new Date(p.created_at).toLocaleDateString('pt-BR'),
        dataInput: p.data_input || '',
        dataAtivacao: p.data_ativacao || '',
        statusPedido: p.status,
        proposta: neg.proposta,
        valor: neg.valor,
        status: neg.status,
        data: neg.data,
        totalAcessos,
        created_at: p.created_at
      };
    });

    return res.json(result);
  } catch (error) {
    console.error('Erro ao listar pedidos concluídos:', error);
    return res.status(500).json({ error: 'Erro interno ao listar pedidos.' });
  }
}

export async function atualizarPedidoDeVenda(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      num_p2b,
      num_radar,
      data_entrada,
      data_input,
      data_ativacao
    } = req.body || {};
    const pedido = await PedidoDeVenda.findByPk(id);
    if (!pedido) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    if (status !== undefined && status !== null) pedido.status = String(status);
    if (num_p2b !== undefined) pedido.num_p2b = num_p2b || null;
    if (num_radar !== undefined) pedido.num_radar = num_radar || null;
    if (data_entrada !== undefined) pedido.data_entrada = data_entrada || null;
    if (data_input !== undefined) pedido.data_input = data_input || null;
    if (data_ativacao !== undefined) pedido.data_ativacao = data_ativacao || null;
    await pedido.save();
    return res.json({
      id: pedido.id,
      negotiation_id: pedido.negotiation_id,
      status: pedido.status,
      num_p2b: pedido.num_p2b,
      num_radar: pedido.num_radar,
      data_entrada: pedido.data_entrada,
      data_input: pedido.data_input,
      data_ativacao: pedido.data_ativacao
    });
  } catch (error) {
    console.error('Erro ao atualizar pedido de venda:', error);
    return res.status(500).json({ error: 'Erro interno ao atualizar pedido.' });
  }
}
