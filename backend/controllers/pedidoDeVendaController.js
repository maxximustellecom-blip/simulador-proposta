import { PedidoDeVenda, Negotiation, NegociacaoProposta, NegociacaoPropostaCustomizada, Client, User, AccessProfile } from '../models/index.js';
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

function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parsePercentage(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace('%', '').replace(',', '.')) / 100;
}

function parseCommissionRate(str) {
  if (str === null || str === undefined) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  return parsePercentage(s);
}

function parseMoneyLike(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const raw = String(v === null || v === undefined ? '' : v).trim();
  if (!raw) return 0;
  const cleaned = raw.replace(/[^\d.,-]/g, '');
  if (!cleaned) return 0;
  const hasDot = cleaned.includes('.');
  const hasComma = cleaned.includes(',');
  const normalized = (hasDot && hasComma)
    ? cleaned.replace(/\./g, '').replace(',', '.')
    : (hasComma ? cleaned.replace(',', '.') : cleaned);
  const n = Number(normalized);
  return isFinite(n) ? n : 0;
}

function hasCommissionConfig(config) {
  if (!config || typeof config !== 'object') return false;
  const products = Array.isArray(config.products) ? config.products : [];
  const levels = Array.isArray(config.levels) ? config.levels : [];
  const hasProducts = products.some(p => {
    if (!p || typeof p !== 'object') return false;
    return ['novo', 'aditivo', 'portabilidade', 'renovacao', 'ultra_fibra', 'wttx', 'm2m', 'controle', 'migracao', 'tt']
      .some(k => parsePercentage(p[k]) > 0);
  });
  const hasLevels = levels.some(l => parseMoneyLike(l && l.revenue) > 0);
  return hasProducts || hasLevels;
}

function pickLevelNameFromConfig(baseRevenue, levels) {
  const list = Array.isArray(levels) ? levels.slice() : [];
  const parsed = list
    .map(l => ({ name: l && l.name ? String(l.name) : '', revenue: parseMoneyLike(l && l.revenue) }))
    .filter(x => x.name);
  if (parsed.length === 0) return 'BLUE';
  parsed.sort((a, b) => a.revenue - b.revenue);
  let chosen = parsed[0].name;
  for (const row of parsed) {
    if (baseRevenue >= row.revenue) chosen = row.name;
  }
  return chosen;
}

function rowHasRates(row) {
  if (!row || typeof row !== 'object') return false;
  return ['novo', 'aditivo', 'portabilidade', 'renovacao', 'ultra_fibra', 'wttx', 'm2m', 'controle', 'migracao', 'tt']
    .some(k => {
      const v = row[k];
      if (v === undefined || v === null) return false;
      const s = String(v).trim();
      if (!s) return false;
      const n = parsePercentage(s);
      return isFinite(n) && n > 0;
    });
}

function pickBestProductRow(config, desiredLevelName) {
  const products = config && Array.isArray(config.products) ? config.products : [];
  if (!products.length) return null;
  const desired = products.find(p => p && p.level_group === desiredLevelName) || null;
  if (desired && rowHasRates(desired)) return desired;
  const any = products.find(p => rowHasRates(p)) || null;
  return any;
}

function mapLineToCommissionKey(line) {
  const isPort = String(line && line.portabilidade || '').toLowerCase() === 'sim';
  if (isPort) return 'portabilidade';
  const t = normalizeText((line && (line.tipoNegociacao || line.tipo)) || '')
    .replace(/[/\\]/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.includes('portabilidade')) return 'portabilidade';
  if (t.includes('1º') || t.includes('1o') || (t.includes('acesso') && !t.includes('renov') && !t.includes('reneg'))) return 'novo';
  if (t.includes('novo')) return 'novo';
  if (t.includes('aditivo') || t.includes('adtivo') || t.includes('adit')) return 'aditivo';
  if (t.includes('reneg') || t.includes('renov')) return 'renovacao';
  if (t.includes('ultra fibra') || t.includes('u fibra') || t.includes('ultrafibra')) return 'ultra_fibra';
  if (t.includes('wttx')) return 'wttx';
  if (t.includes('m2m')) return 'm2m';
  if (t.includes('controle')) return 'controle';
  if (t.includes('migracao')) return 'migracao';
  if (t.includes('pf') || t.includes('pj')) return 'pf_pj';
  if (t === 'tt' || t.includes(' tt')) return 'tt';
  return 'outros';
}

function getLineQty(line) {
  if (!line) return 1;
  const isPort = String(line.portabilidade || '').toLowerCase() === 'sim';
  if (isPort) {
    const pi = Array.isArray(line.portarItens) ? line.portarItens.length : 0;
    const pq = Number(line.portarQtd || 0);
    const q = Math.max(pq, pi, Number(line.quantidade || 0), 1);
    return isFinite(q) && q > 0 ? q : 1;
  }
  const q = Number(line.quantidade || 1);
  return isFinite(q) && q > 0 ? q : 1;
}

function getLineUnitValue(line, isCustom) {
  if (!line) return 0;
  if (isCustom) {
    const base = toNumber(line.valorNaoFidelizado !== undefined ? line.valorNaoFidelizado : (line.valorPlano !== undefined ? line.valorPlano : line.precoAtual), 0);
    const desc = toNumber(line.desconto, 0);
    return base * (1 - desc / 100);
  }
  return toNumber(line.valorPlano, 0);
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
      comissao_paga: Boolean(pedido.comissao_paga),
      etiqueta: pedido.etiqueta || null,
      etiqueta_cor: pedido.etiqueta_cor || null,
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
            { model: User, as: 'creator', include: [{ model: AccessProfile, as: 'profile' }] },
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

      const bucketKey = (line) => {
        const isPort = String(line && line.portabilidade || '').toLowerCase() === 'sim';
        const tipo = String((line && (line.tipoNegociacao || line.tipo)) || 'Novo').toLowerCase();
        if (isPort || tipo.includes('port')) return 'port';
        if (tipo.includes('novo')) return 'novo';
        if (tipo.includes('aditivo') || tipo.includes('adtiv')) return 'adit';
        if (tipo.includes('reneg') || tipo.includes('renov')) return 'reneg';
        if (tipo.includes('wttx')) return 'wttx';
        if (tipo.includes('m2m')) return 'm2m';
        if (tipo.includes('fibra') || tipo.includes('ultra')) return 'fibra';
        if (tipo.includes('tim') || tipo.includes('controle')) return 'tim';
        return 'outros';
      };

      // Calculate breakdown for UI grouping (pedido-vendas)
      const breakdown = {};
      const breakdownValor = {};
      linhas.forEach(l => {
        const qtd = getLineQty(l);
        const key = bucketKey(l);
        const unit = getLineUnitValue(l, isCustom);
        breakdown[key] = (breakdown[key] || 0) + qtd;
        breakdownValor[key] = (breakdownValor[key] || 0) + (qtd * unit);
      });

      const parts = [];
      if (breakdown.reneg) parts.push(`${breakdown.reneg} reneg${breakdown.reneg > 1 ? 's' : ''}`);
      if (breakdown.adit) parts.push(`${breakdown.adit} adit${breakdown.adit > 1 ? 's' : ''}`);
      if (breakdown.novo) parts.push(`${breakdown.novo} novo${breakdown.novo > 1 ? 's' : ''}`);
      if (breakdown.port) parts.push(`${breakdown.port} port`);
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
        port: 'Port',
        wttx: 'WTTx',
        m2m: 'M2M',
        fibra: 'Fibra',
        tim: 'TIM',
        outros: 'Outros'
      };
      const ordem = ['reneg', 'adit', 'novo', 'port', 'wttx', 'm2m', 'fibra', 'tim', 'outros'];
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
        comissao_paga: Boolean(p.comissao_paga),
        etiqueta: p.etiqueta || null,
        etiqueta_cor: p.etiqueta_cor || null,
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

export async function exportarComissaoPedidos(req, res) {
  try {
    const { ids } = req.body || {};
    const list = Array.isArray(ids) ? ids.map(x => Number(x)).filter(Boolean) : [];
    if (!list.length) return res.status(400).json({ error: 'ids obrigatórios' });

    const backofficeUsers = await User.findAll({
      where: { backoffice: true },
      order: [['name', 'ASC']]
    });
    const backofficeTotalById = new Map();
    (backofficeUsers || []).forEach(u => {
      if (u && u.id) backofficeTotalById.set(Number(u.id), 0);
    });

    const pedidos = await PedidoDeVenda.findAll({
      where: { id: { [Op.in]: list } },
      include: [
        {
          model: Negotiation,
          as: 'negotiation',
          include: [
            { model: Client, as: 'client' },
            { model: User, as: 'creator', include: [{ model: AccessProfile, as: 'profile' }] },
            { model: NegociacaoProposta, as: 'proposal' },
            { model: NegociacaoPropostaCustomizada, as: 'customProposal' }
          ]
        }
      ],
      order: [['created_at', 'DESC']]
    });

    const uniqueNegotiationIds = new Set();
    const prepared = [];
    pedidos.forEach(p => {
      if (!p || !p.negotiation_id || uniqueNegotiationIds.has(p.negotiation_id)) return;
      uniqueNegotiationIds.add(p.negotiation_id);
      const neg = p.negotiation || {};
      const prop = neg.proposal || null;
      const cust = neg.customProposal || null;
      let linhas = [];
      let isCustom = false;
      if (prop && prop.linhas && Array.isArray(prop.linhas)) linhas = prop.linhas;
      else if (cust && cust.linhas && Array.isArray(cust.linhas)) { linhas = cust.linhas; isCustom = true; }

      const breakdownValor = {};
      const breakdownQtd = {};
      let totalAcessos = 0;
      linhas.forEach(l => {
        const qtd = getLineQty(l);
        totalAcessos += qtd;
        const key = mapLineToCommissionKey(l);
        const unit = getLineUnitValue(l, isCustom);
        breakdownQtd[key] = (breakdownQtd[key] || 0) + qtd;
        breakdownValor[key] = (breakdownValor[key] || 0) + (qtd * unit);
      });

      const labels = {
        novo: 'Novo',
        aditivo: 'Aditivo',
        portabilidade: 'Portabilidade',
        renovacao: 'Renov.',
        ultra_fibra: 'U. Fibra',
        wttx: 'WTTX',
        m2m: 'M2M',
        controle: 'Controle',
        migracao: 'Migração',
        pf_pj: 'PF/PJ',
        tt: 'TT',
        outros: 'Outros'
      };
      const ordem = ['novo', 'aditivo', 'portabilidade', 'renovacao', 'ultra_fibra', 'wttx', 'm2m', 'controle', 'migracao', 'pf_pj', 'tt', 'outros'];
      const itensResumo = ordem
        .filter(k => breakdownQtd[k] && breakdownValor[k] !== undefined)
        .map(k => ({ qtd: Number(breakdownQtd[k] || 0), tipo: labels[k] || k, valor: toNumber(breakdownValor[k], 0) }));

      (backofficeUsers || []).forEach(bo => {
        if (!bo || !bo.id) return;
        let total = backofficeTotalById.get(Number(bo.id)) || 0;

        const fixedByKey = {
          novo: toNumber(bo.comissao_novo, 0),
          aditivo: toNumber(bo.comissao_aditivo, 0),
          portabilidade: toNumber(bo.comissao_novo, 0),
          renovacao: toNumber(bo.comissao_renovacao, 0),
          ultra_fibra: toNumber(bo.comissao_ultra_fibra, 0),
          wttx: toNumber(bo.comissao_wttx, 0),
          m2m: toNumber(bo.comissao_m2m, 0),
          controle: toNumber(bo.comissao_controle_pf, 0),
          migracao: toNumber(bo.comissao_migracao, 0),
          pf_pj: toNumber(bo.comissao_pf_pj, 0),
          tt: toNumber(bo.comissao_tt, 0),
          outros: 0
        };

        Object.keys(breakdownQtd || {}).forEach(key => {
          const qtd = Number(breakdownQtd[key] || 0);
          if (!qtd) return;
          const fixed = Number(fixedByKey[key] || 0);
          total += qtd * fixed;
        });

        backofficeTotalById.set(Number(bo.id), total);
      });

      const creator = neg.creator || null;
      const profile = creator && creator.profile ? creator.profile : null;
      const rawConfig = profile && profile.commission_config ? profile.commission_config : null;
      const commission_config = (typeof rawConfig === 'string') ? (() => { try { return JSON.parse(rawConfig); } catch { return null; } })() : rawConfig;
      const consultorTipo = creator ? (creator.tipo || 'interno') : 'interno';
      const comissaoFixaAtiva = creator ? Boolean(creator.comissao_fixa_ativa) : false;
      const specificCommissions = {
        novo: creator ? toNumber(creator.comissao_novo, 0) : 0,
        aditivo: creator ? toNumber(creator.comissao_aditivo, 0) : 0,
        renovacao: creator ? toNumber(creator.comissao_renovacao, 0) : 0,
        migracao: creator ? toNumber(creator.comissao_migracao, 0) : 0,
        ultra_fibra: creator ? toNumber(creator.comissao_ultra_fibra, 0) : 0,
        tt: creator ? toNumber(creator.comissao_tt, 0) : 0,
        wttx: creator ? toNumber(creator.comissao_wttx, 0) : 0,
        m2m: creator ? toNumber(creator.comissao_m2m, 0) : 0,
        controle: creator ? toNumber(creator.comissao_controle_pf, 0) : 0,
        pf_pj: creator ? toNumber(creator.comissao_pf_pj, 0) : 0
      };

      const baseRow = {
        pedido_id: p.id,
        negotiation_id: p.negotiation_id,
        razaoSocial: neg.client?.name || '',
        dataAtivacao: p.data_ativacao || '',
        totalAcessos,
        itensResumo,
        breakdownQtd,
        statusPedido: p.status || ''
      };

      if (creator && creator.id) {
        prepared.push({
          ...baseRow,
          consultor_id: creator.id,
          consultor: creator.name || '',
          consultorTipo,
          comissaoFixaAtiva,
          specificCommissions,
          commission_config
        });
      }
    });

    const DEFAULT_RATES = {
      novo: 0.6,
      aditivo: 0.6,
      portabilidade: 0.6,
      renovacao: 0.3,
      ultra_fibra: 0.3,
      wttx: 0.6,
      m2m: 0.6,
      controle: 0.6,
      migracao: 0.3,
      tt: 0.3,
      outros: 0
    };

    const byConsultor = new Map();
    prepared.forEach(r => {
      const k = Number(r.consultor_id || 0);
      if (!k) return;
      if (!byConsultor.has(k)) byConsultor.set(k, []);
      byConsultor.get(k).push(r);
    });

    const consultorRule = new Map();
    byConsultor.forEach((rows, consultorId) => {
      const cfg = rows[0] ? rows[0].commission_config : null;
      const useLevel = hasCommissionConfig(cfg);
      const baseRevenue = rows.reduce((acc, row) => {
        const itens = Array.isArray(row.itensResumo) ? row.itensResumo : [];
        const sum = itens.reduce((a, it) => {
          const t = normalizeText(it && it.tipo);
          if (t.includes('novo')) return a + toNumber(it.valor, 0);
          if (t.includes('aditivo') || t.includes('adit')) return a + toNumber(it.valor, 0);
          return a;
        }, 0);
        return acc + sum;
      }, 0);
      const levelName = useLevel ? pickLevelNameFromConfig(baseRevenue, cfg && cfg.levels) : null;
      const levelRow = useLevel ? pickBestProductRow(cfg, levelName) : null;
      consultorRule.set(consultorId, { useLevel, levelRow, defaults: DEFAULT_RATES });
    });

    const result = [];
    prepared.forEach(row => {
      const rule = consultorRule.get(Number(row.consultor_id || 0)) || { useLevel: false, levelRow: null, defaults: DEFAULT_RATES };
      const itens = Array.isArray(row.itensResumo) ? row.itensResumo : [];
      
      if (itens.length === 0) {
        // Fallback for empty items
        result.push({
          consultor: row.consultor || '',
          razaoSocial: row.razaoSocial,
          dataAtivacao: row.dataAtivacao,
          totalAcessos: row.totalAcessos,
          produto: '-',
          tipo: '-',
          valor: 0,
          statusPedido: row.statusPedido,
          comissao: 0
        });
        return;
      }

      itens.forEach(it => {
        const label = normalizeText(it && it.tipo);
        let key = 'outros';
        if (label.includes('novo')) key = 'novo';
        else if (label.includes('aditivo') || label.includes('adit')) key = 'aditivo';
        else if (label.includes('port')) key = 'portabilidade';
        else if (label.includes('renov')) key = 'renovacao';
        else if (label.includes('u. fibra') || label.includes('ultra') || label.includes('fibra')) key = 'ultra_fibra';
        else if (label.includes('wttx')) key = 'wttx';
        else if (label.includes('m2m')) key = 'm2m';
        else if (label.includes('controle')) key = 'controle';
        else if (label.includes('migr')) key = 'migracao';
        else if (label.includes('pf') || label.includes('pj')) key = 'pf_pj';
        else if (label === 'tt') key = 'tt';

        let lineComissao = 0;
        if (row.comissaoFixaAtiva) {
          const sc = row.specificCommissions || {};
          const bqKey = (key === 'portabilidade') ? 'novo' : key;
          const fixedVal = Number(sc[bqKey] || 0);
          lineComissao = (Number(it.qtd || 0) * fixedVal);
        } else if (rule.useLevel) {
          let rate = 0;
          if (rule.levelRow) {
            const raw = rule.levelRow[key];
            if (raw !== undefined && raw !== null) {
              const rawStr = String(raw).trim();
              if (rawStr !== '') {
                const parsed = parsePercentage(rawStr);
                const isExplicitZero = /^0+([,.]0+)?%?$/.test(rawStr);
                if (isFinite(parsed) && (parsed > 0 || isExplicitZero)) rate = parsed;
              }
            }
          }
          lineComissao = toNumber(it.valor, 0) * rate;
        } else if (String(row.consultorTipo || '').toLowerCase() === 'externo') {
          const eligible = (key === 'novo' || key === 'aditivo' || key === 'migracao');
          const sc = row.specificCommissions || {};
          const fixedVal = Number(sc[key] || 0);
          lineComissao = eligible ? (Number(it.qtd || 0) * fixedVal) : 0;
        } else {
          const rate = (rule.defaults && rule.defaults[key] !== undefined) ? rule.defaults[key] : 0;
          lineComissao = toNumber(it.valor, 0) * rate;
        }

        result.push({
          consultor: row.consultor || '',
          razaoSocial: row.razaoSocial,
          dataAtivacao: row.dataAtivacao,
          totalAcessos: it.qtd || 0,
          produto: it.tipo || '-',
          tipo: key.toUpperCase(),
          valor: toNumber(it.valor, 0),
          statusPedido: row.statusPedido,
          comissao: lineComissao
        });
      });
    });

    const totalsByConsultor = new Map();
    (result || []).forEach(r => {
      if (!r || r.is_total) return;
      const name = String(r.consultor || '').trim();
      if (!name) return;
      totalsByConsultor.set(name, (totalsByConsultor.get(name) || 0) + toNumber(r.comissao, 0));
    });

    const totalBackoffice = Array.from(backofficeTotalById.values()).reduce((acc, v) => acc + toNumber(v, 0), 0);
    const totalVendedores = Array.from(totalsByConsultor.values()).reduce((acc, v) => acc + toNumber(v, 0), 0);
    const totalEmpresa = totalVendedores + totalBackoffice;

    result.push({ row_type: 'separator' });
    result.push({ row_type: 'summary_header', label: 'RESUMO' });

    Array.from(totalsByConsultor.entries())
      .sort((a, b) => String(a[0] || '').localeCompare(String(b[0] || ''), 'pt-BR'))
      .forEach(([name, total]) => {
        result.push({
          is_total: true,
          total_kind: 'seller',
          total_label: 'TOTAL VENDEDOR',
          consultor: name,
          comissao: toNumber(total, 0)
        });
      });

    (backofficeUsers || []).forEach(bo => {
      if (!bo || !bo.id) return;
      const total = backofficeTotalById.get(Number(bo.id)) || 0;
      result.push({
        is_total: true,
        total_kind: 'backoffice',
        total_label: 'TOTAL BACKOFFICE',
        consultor: bo.name || '',
        comissao: toNumber(total, 0)
      });
    });

    if ((backofficeUsers || []).length > 1) {
      result.push({
        is_total: true,
        total_kind: 'backoffice_all',
        total_label: 'TOTAL BACKOFFICE',
        consultor: 'TODOS',
        comissao: toNumber(totalBackoffice, 0)
      });
    }

    result.push({
      is_total: true,
      total_kind: 'company',
      total_label: 'TOTAL EMPRESA',
      consultor: '',
      comissao: toNumber(totalEmpresa, 0)
    });

    return res.json(result);
  } catch (error) {
    console.error('Erro ao exportar comissão:', error);
    return res.status(500).json({ error: 'Erro interno ao exportar comissão.' });
  }
}

export async function atualizarPedidoDeVenda(req, res) {
  try {
    const { id } = req.params;
    const {
      status,
      comissao_paga,
      etiqueta,
      etiqueta_cor,
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
    if (comissao_paga !== undefined) {
      pedido.comissao_paga = (comissao_paga === true || comissao_paga === 'true' || comissao_paga === 1 || comissao_paga === '1');
    }
    if (etiqueta !== undefined) {
      const v = String(etiqueta || '').trim();
      pedido.etiqueta = v ? v : null;
    }
    if (etiqueta_cor !== undefined) {
      const c = String(etiqueta_cor || '').trim();
      pedido.etiqueta_cor = c ? c : null;
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
      comissao_paga: Boolean(pedido.comissao_paga),
      etiqueta: pedido.etiqueta || null,
      etiqueta_cor: pedido.etiqueta_cor || null,
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
