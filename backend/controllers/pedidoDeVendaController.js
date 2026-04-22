import { PedidoDeVenda, Negotiation, NegociacaoProposta, NegociacaoPropostaCustomizada, Client, User } from '../models/index.js';
import { Op } from 'sequelize';

function toNumber(x, d = 0) {
  if (typeof x === 'number') return isFinite(x) ? x : d;
  const raw = String(x === null || x === undefined ? '' : x).trim();
  if (!raw) return d;
  const cleaned = raw.replace(/[^\d.,-]/g, '');
  if (!cleaned) return d;
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');
  const normalized = (hasDot && hasComma)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : (hasComma ? cleaned.replace(',', '.') : cleaned);
  const n = Number(normalized);
  return isFinite(n) ? n : d;
}

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
      distinct: true,
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

    // Formatting the response and ensuring uniqueness by negotiation_id
    const uniqueNegotiationIds = new Set();
    const result = pedidos.reduce((acc, p) => {
      if (!p.negotiation_id || uniqueNegotiationIds.has(p.negotiation_id)) return acc;
      uniqueNegotiationIds.add(p.negotiation_id);
      
      const neg = p.negotiation || {};
      const prop = neg.proposal || null;
      const cust = neg.customProposal || null;
      let totalAcessos = 0;
      let linhas = [];
      let isCustom = false;
      if (prop && prop.linhas && Array.isArray(prop.linhas)) {
        linhas = prop.linhas;
        totalAcessos = linhas.reduce((sum, l) => {
          const q = Number(l && l.quantidade !== undefined ? l.quantidade : 1);
          return sum + (isFinite(q) ? q : 1);
        }, 0);
      } else if (cust && cust.linhas && Array.isArray(cust.linhas)) {
        linhas = cust.linhas;
        isCustom = true;
        totalAcessos = linhas.reduce((sum, l) => {
          const q = Number(l && l.quantidade !== undefined ? l.quantidade : 1);
          return sum + (isFinite(q) ? q : 1);
        }, 0);
      } else {
        totalAcessos = Number(prop?.total_acessos || cust?.total_acessos || 0);
      }

      const bucketKey = (raw) => {
        const tipo = String(raw || 'Novo').toLowerCase();
        if (tipo.includes('novo')) return 'novo';
        if (tipo.includes('aditivo') || tipo.includes('adtiv')) return 'adit';
        if (tipo.includes('reneg') || tipo.includes('renov')) return 'reneg';
        if (tipo.includes('wttx')) return 'wttx';
        if (tipo.includes('m2m')) return 'm2m';
        if (tipo.includes('fibra') || tipo.includes('ultra')) return 'fibra';
        if (tipo.includes('tim') || tipo.includes('controle')) return 'tim';
        return 'outros';
      };

      // Calculate breakdown by tipoNegociacao (Novo, Renegociação, Aditivo, WTTx, etc.)
      const breakdown = {};
      const breakdownValor = {};
      linhas.forEach(l => {
        const qtd = toNumber(l.quantidade, 1) || 1;
        const key = bucketKey(l.tipoNegociacao || l.tipo);
        const unit = (() => {
          if (isCustom) {
            const v = toNumber(l.valorNaoFidelizado !== undefined ? l.valorNaoFidelizado : (l.valorPlano !== undefined ? l.valorPlano : l.precoAtual), 0);
            const desc = toNumber(l.desconto, 0);
            const planoFinal = v * (1 - desc / 100);
            return planoFinal;
          }
          return toNumber(l.valorPlano, 0);
        })();
        breakdown[key] = (breakdown[key] || 0) + qtd;
        breakdownValor[key] = (breakdownValor[key] || 0) + (qtd * unit);
      });

      // Build info string like "7 novos, 8 reneg, 3 wttx"
      const parts = [];
      if (breakdown.reneg) parts.push(`${breakdown.reneg} reneg${breakdown.reneg > 1 ? 's' : ''}`);
      if (breakdown.adit) parts.push(`${breakdown.adit} adit${breakdown.adit > 1 ? 's' : ''}`);
      if (breakdown.novo) parts.push(`${breakdown.novo} novo${breakdown.novo > 1 ? 's' : ''}`);
      if (breakdown.wttx) parts.push(`${breakdown.wttx} wttx`);
      if (breakdown.m2m) parts.push(`${breakdown.m2m} m2m`);
      if (breakdown.fibra) parts.push(`${breakdown.fibra} fibra`);
      if (breakdown.tim) parts.push(`${breakdown.tim} tim`);
      if (breakdown.outros) parts.push(`${breakdown.outros} outro${breakdown.outros > 1 ? 's' : ''}`);
      const infoTexto = parts.length > 0 ? parts.join(', ') : '-';

      const labels = {
        reneg: 'reneg',
        adit: 'Adit',
        novo: 'Novo',
        wttx: 'WTTx',
        m2m: 'M2M',
        fibra: 'Fibra',
        tim: 'TIM',
        outros: 'Outros'
      };
      const ordem = ['reneg', 'adit', 'novo', 'wttx', 'm2m', 'fibra', 'tim', 'outros'];
      const totalTarget = toNumber(neg.valor, 0);
      const totalRaw = ordem.reduce((sum, k) => sum + toNumber(breakdownValor[k], 0), 0);
      const scale = (totalRaw > 0 && totalTarget > 0) ? (totalTarget / totalRaw) : 1;
      const itensResumo = ordem
        .filter(k => breakdown[k] && breakdownValor[k] !== undefined)
        .map(k => ({ qtd: Number(breakdown[k] || 0), tipo: labels[k] || k, valor: toNumber(breakdownValor[k], 0) * scale }));

      acc.push({
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
        infoTexto,
        breakdown,
        itensResumo,
        created_at: p.created_at
      });
      return acc;
    }, []);

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
    if (status !== undefined && status !== null) {
      pedido.status = String(status);
      if (String(status) === '7-Contratos Ativos') {
        const negotiation = await Negotiation.findByPk(pedido.negotiation_id);
        if (negotiation) {
          negotiation.funil_stage = 5; // Finalizado
          await negotiation.save();
        }
      }
    }
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
