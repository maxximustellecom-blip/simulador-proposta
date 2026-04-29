import { Client, Simulation, Sale, Negotiation, User, AccessProfile, NegociacaoProposta, NegociacaoPropostaCustomizada, PedidoDeVenda, Product, CustomProduct } from '../models/index.js';

function parsePercentage(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace('%', '').replace(',', '.')) / 100;
}

function parseCommissionRate(str) {
  if (typeof str === 'number') {
    if (!isFinite(str)) return 0;
    if (Math.abs(str) >= 10) return str / 10000;
    return str / 100;
  }
  if (str === null || str === undefined) return 0;
  const s = String(str).trim();
  if (!s) return 0;
  const raw = s.replace('%', '').replace(',', '.');
  const n = Number(raw);
  if (!isFinite(n)) return 0;
  if (Math.abs(n) >= 10) return n / 10000;
  return n / 100;
}

function normalizeText(str) {
  return String(str || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function parseMoneyLike(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  const s = String(v || '').trim();
  if (!s) return 0;
  const only = s.replace(/[^\d,.-]/g, '');
  if (!only) return 0;
  if (only.includes(',') && only.includes('.')) {
    const normalized = only.replace(/\./g, '').replace(',', '.');
    const n = Number(normalized);
    return isFinite(n) ? n : 0;
  }
  const n = Number(only.replace(',', '.'));
  return isFinite(n) ? n : 0;
}

function getWeekOfMonth(dateStr) {
  // dateStr is DD/MM/YYYY
  try {
    const parts = dateStr.split('/');
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    const date = new Date(year, month, day);
    const firstDay = new Date(year, month, 1);
    const startWeekday = firstDay.getDay(); // 0=Sunday
    return Math.ceil((day + startWeekday) / 7);
  } catch { return 0; }
}

function mapCommissionKeyToGroup(key) {
  if (key === 'novo' || key === 'aditivo' || key === 'portabilidade') return 'novo';
  if (key === 'renovacao' || key === 'migracao' || key === 'tt') return 'reneg';
  if (key === 'ultra_fibra' || key === 'wttx' || key === 'm2m') return 'fibra';
  if (key === 'controle') return 'tim';
  return 'novo';
}

function mapProductToCommissionKeyFromRaw(tipoRaw, isPortabilidade) {
  if (isPortabilidade) return 'portabilidade';
  const t = normalizeText(tipoRaw)
    .replace(/[/\\]/g, ' ')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (t.includes('portabilidade')) return 'portabilidade';
  if (t.includes('novo')) return 'novo';
  if (t.includes('aditivo') || t.includes('adtivo') || t.includes('adit')) return 'aditivo';
  if (t.includes('renov')) return 'renovacao';
  if (t.includes('ultra fibra') || t.includes('u fibra') || t.includes('ultrafibra')) return 'ultra_fibra';
  if (t.includes('wttx')) return 'wttx';
  if (t.includes('m2m')) return 'm2m';
  if (t.includes('controle')) return 'controle';
  if (t.includes('migracao') && (t.includes('pf') || t.includes('pj') || t.includes('pf pj'))) return 'migracao';
  if (t === 'tt' || t.includes(' tt')) return 'tt';
  return 'novo';
}

function hasCommissionConfig(config) {
  if (!config || typeof config !== 'object') return false;
  const products = Array.isArray(config.products) ? config.products : [];
  const levels = Array.isArray(config.levels) ? config.levels : [];
  const hasProducts = products.some(p => {
    if (!p || typeof p !== 'object') return false;
    return ['novo', 'aditivo', 'portabilidade', 'renovacao', 'ultra_fibra', 'wttx', 'm2m', 'controle', 'migracao', 'tt']
      .some(k => parseCommissionRate(p[k]) > 0);
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
      const n = parseCommissionRate(s);
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

function getLineTypeRaw(n, l, productTypeByName) {
  const direct = (l && (l.tipoNegociacao || l.tipo)) || (n && n.tipo) || '';
  if (direct) return direct;
  const plan = (l && (l.plano || l.planoSelecionado)) || '';
  if (!plan) return '';
  return productTypeByName.get(String(plan)) || '';
}

function getLineQty(l) {
  if (!l) return 1;
  const isPort = String(l.portabilidade || '').toLowerCase() === 'sim';
  if (isPort) {
    const pi = Array.isArray(l.portarItens) ? l.portarItens.length : 0;
    const pq = Number(l.portarQtd || 0);
    const q = Math.max(pq, pi, Number(l.quantidade || 0), 1);
    return isFinite(q) && q > 0 ? q : 1;
  }
  const q = Number(l.quantidade || 1);
  return isFinite(q) && q > 0 ? q : 1;
}

function getLineValue(l) {
  const q = getLineQty(l);
  const v = Number(l && l.valorPlano !== undefined ? l.valorPlano : 0);
  const vv = isFinite(v) ? v : 0;
  return vv * q;
}

export async function getQuadroVendas(req, res) {
  try {
    const { month, year, week } = req.query;
    const targetMonth = parseInt(month);
    const targetYear = parseInt(year);
    const targetWeek = parseInt(week || 0);

    const users = await User.findAll({
      where: { role: 'user' },
      include: [{ model: AccessProfile, as: 'profile' }]
    });

    const negotiations = await Negotiation.findAll({
      include: [
        { model: PedidoDeVenda, as: 'pedidoDeVenda' },
        { model: NegociacaoProposta, as: 'proposal' },
        { model: NegociacaoPropostaCustomizada, as: 'customProposal' }
      ]
    });

    const [products, customProducts] = await Promise.all([
      Product.findAll({ attributes: ['nome', 'tipos'] }),
      CustomProduct.findAll({ attributes: ['nome', 'tipos'] })
    ]);
    const productTypeByName = new Map();
    (products || []).forEach(p => {
      if (p && p.nome) productTypeByName.set(String(p.nome), p.tipos || '');
    });
    (customProducts || []).forEach(p => {
      if (p && p.nome && !productTypeByName.has(String(p.nome))) productTypeByName.set(String(p.nome), p.tipos || '');
    });

    // Filter by month/year
    const filteredNegs = negotiations.filter(n => {
      const parts = String(n.data || '').split('/');
      if (parts.length !== 3) return false;
      const m = parseInt(parts[1]);
      const y = parseInt(parts[2]);
      if (m !== targetMonth || y !== targetYear) return false;
      if (targetWeek !== 0) {
        const w = getWeekOfMonth(n.data);
        if (w !== targetWeek) return false;
      }
      return true;
    });

    const result = users.map(user => {
      const userNegs = filteredNegs.filter(n => Number(n.created_by) === Number(user.id));
      
      const config = user.profile && user.profile.commission_config ? (typeof user.profile.commission_config === 'string' ? JSON.parse(user.profile.commission_config) : user.profile.commission_config) : null;
      const shouldUseLevel = hasCommissionConfig(config);
      let baseRevenueForLevel = 0;
      if (shouldUseLevel) {
        userNegs.forEach(n => {
          const isAtiva = n.pedidoDeVenda && n.pedidoDeVenda.status === '7-Contratos Ativos';
          if (!isAtiva) return;
          const lines = n.proposal ? n.proposal.linhas : (n.customProposal ? n.customProposal.linhas : []);
          const linesArr = Array.isArray(lines) ? lines : [];
          linesArr.forEach(l => {
            const isPort = String(l && l.portabilidade || '').toLowerCase() === 'sim';
            const tipoRaw = getLineTypeRaw(n, l, productTypeByName);
            const key = mapProductToCommissionKeyFromRaw(tipoRaw, isPort);
            if (key === 'novo' || key === 'aditivo') baseRevenueForLevel += getLineValue(l);
          });
        });
      }
      const levelName = shouldUseLevel ? pickLevelNameFromConfig(baseRevenueForLevel, config.levels) : null;
      const levelConfigRow = shouldUseLevel ? pickBestProductRow(config, levelName) : null;
      
      const stats = {
        name: user.name,
        novo: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        reneg: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        fibra: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        tim: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } }
      };

      userNegs.forEach(n => {
        const isAtiva = n.pedidoDeVenda && n.pedidoDeVenda.status === '7-Contratos Ativos';
        const isEntrante = n.status === 'Em andamento' && !isAtiva;
        
        if (!isAtiva && !isEntrante) return;

        const lines = n.proposal ? n.proposal.linhas : (n.customProposal ? n.customProposal.linhas : []);
        const linesArr = Array.isArray(lines) ? lines : [];

        linesArr.forEach(l => {
          const isPort = String(l && l.portabilidade || '').toLowerCase() === 'sim';
          const tipoRaw = getLineTypeRaw(n, l, productTypeByName);
          const key = mapProductToCommissionKeyFromRaw(tipoRaw, isPort);
          const group = mapCommissionKeyToGroup(key);
          const itemVal = getLineValue(l);
          const qtd = getLineQty(l);
          
          let rate = 0;
          const defaults = {
            novo: 0.6,
            aditivo: 0.6,
            portabilidade: 0.6,
            renovacao: 0.3,
            ultra_fibra: 0.3,
            wttx: 0.6,
            m2m: 0.6,
            controle: 0.6,
            migracao: 0.3,
            tt: 0.3
          };
          const fallback = defaults[key] || 0;
          rate = fallback;
          if (shouldUseLevel && levelConfigRow) {
            const raw = levelConfigRow[key];
            if (raw !== undefined && raw !== null) {
              const rawStr = String(raw).trim();
              if (rawStr !== '') {
                const parsed = parseCommissionRate(rawStr);
                const isExplicitZero = /^0+([,.]0+)?%?$/.test(rawStr);
                if (isFinite(parsed) && (parsed > 0 || isExplicitZero)) rate = parsed;
              }
            }
          }
          const target = isAtiva ? stats[group].at : stats[group].ent;
          target.qtd += qtd;
          target.rec += itemVal * rate;
        });
      });

      return stats;
    });

    return res.json(result);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'erro ao gerar quadro de vendas', details: String(err.message) });
  }
}

function calcularNivel(receitaTotal) {
  if (receitaTotal < 700) return { nome: 'BLUE', fator: 0.6 };
  if (receitaTotal < 900) return { nome: 'SILVER', fator: 0.8 };
  if (receitaTotal < 1500) return { nome: 'PLATINUM', fator: 1.0 };
  if (receitaTotal < 1900) return { nome: 'BLACK', fator: 1.5 };
  return { nome: 'BLACK+', fator: 2.0 };
}

function calcularComissaoProduto(receitaBase, tipo, valorVenda) {
  const nivel = calcularNivel(receitaBase);
  const taxas = {
    'BLUE': { novos: 0.6, renovacao: 0.3, ultraFibra: 0.3, wttx: 0.6, m2m: 0.6 },
    'SILVER': { novos: 0.8, renovacao: 0.3, ultraFibra: 0.3, wttx: 0.6, m2m: 0.6 },
    'PLATINUM': { novos: 1.0, renovacao: 0.4, ultraFibra: 0.5, wttx: 1.0, m2m: 0.6 },
    'BLACK': { novos: 1.5, renovacao: 0.5, ultraFibra: 0.7, wttx: 1.5, m2m: 0.6 },
    'BLACK+': { novos: 2.0, renovacao: 0.6, ultraFibra: 0.8, wttx: 2.0, m2m: 0.6 }
  };
  const taxa = taxas[nivel.nome][tipo] || 0;
  return Number(valorVenda) * taxa;
}

async function recomputeSimulation(simulationId) {
  const sales = await Sale.findAll({ where: { simulation_id: simulationId } });
  if (!sales || sales.length === 0) {
    await Simulation.destroy({ where: { id: simulationId } });
    return null;
  }
  const receitaNovos = sales.filter(s => s.tipo === 'novos').reduce((acc, s) => acc + Number(s.receita || 0), 0);
  const receitaTotal = sales.reduce((acc, s) => acc + Number(s.receita || 0), 0);
  const nivel = calcularNivel(receitaNovos);
  const detalhes = sales.map(s => calcularComissaoProduto(receitaNovos, s.tipo, Number(s.receita || 0)));
  const comissaoTotal = detalhes.reduce((acc, c) => acc + c, 0);
  await Simulation.update({
    receita_novos: receitaNovos,
    receita_total: receitaTotal,
    nivel_nome: nivel.nome,
    nivel_fator: nivel.fator,
    comissao_total: comissaoTotal
  }, { where: { id: simulationId } });
  return await Simulation.findByPk(simulationId);
}

function mapTipoKeyNegotiation(tipo) {
  const t = String(tipo || '').toUpperCase();
  if (t.includes('1º') || t.includes('NOVO') || t.includes('ADIT') || t.includes('ADTIVO')) return 'novos';
  if (t.includes('REN') || t.includes('RENEGOC') || t.includes('RENOVA')) return 'renovacao';
  if (t.includes('ULTRA')) return 'ultraFibra';
  if (t.includes('WTTX')) return 'wttx';
  if (t.includes('M2M')) return 'm2m';
  return 'novos';
}

export async function listSalesFromNegotiations(req, res) {
  try {
    const { vendedor, razao, cnpj, data } = req.query || {};
    let list = await Negotiation.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name'] },
        { model: Client, as: 'client' }
      ],
      order: [['created_at', 'DESC']]
    });
    if (req.user && req.user.role === 'user' && req.user.id) {
      list = list.filter(n => Number(n.created_by || 0) === Number(req.user.id));
    }
    if (vendedor) {
      list = list.filter(n => (n.creator?.name || '') === String(vendedor));
    }
    if (razao) {
      const needle = String(razao).trim().toUpperCase();
      list = list.filter(n => (n.client?.name || '').toUpperCase().includes(needle));
    }
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, '');
      list = list.filter(n => String(n.cnpj || '').replace(/\D/g, '').includes(clean));
    }
    if (data) {
      const br = String(data).split('-').reverse().join('/');
      list = list.filter(n => String(n.data || '').includes(br));
    }
    const result = list.map(n => ({
      id: n.id,
      tipo: mapTipoKeyNegotiation(n.tipo),
      receita: n.valor !== null && n.valor !== undefined ? Number(n.valor) : 0,
      vendedor: n.creator?.name || '-',
      nome: n.client?.name || '',
      cnpj: n.cnpj || '',
      p2b: 0,
      data: n.data || '',
      status: n.status || 'Em andamento'
    }));
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar vendas de negociações', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateSale(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { id } = req.params;
    const { tipo, receita, vendedor, p2b } = req.body || {};
    const sale = await Sale.findByPk(id, { include: [{ model: Client, as: 'client' }] });
    if (!sale) return res.status(404).json({ error: 'venda não encontrada' });
    if (tipo) sale.tipo = tipo;
    if (receita !== undefined) sale.receita = Number(receita || 0);
    if (vendedor) sale.vendedor = vendedor;
    if (p2b !== undefined) sale.p2b = Number(p2b || 0);
    await sale.save();
    const sim = await recomputeSimulation(sale.simulation_id);
    const updated = await Sale.findByPk(id, { include: [{ model: Client, as: 'client' }] });
    return res.json({
      simulation: sim,
      sale: updated
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar venda', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteSale(req, res) {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { id } = req.params;
    const sale = await Sale.findByPk(id);
    if (!sale) return res.status(404).json({ error: 'venda não encontrada' });
    const simId = sale.simulation_id;
    await Sale.destroy({ where: { id } });
    const sim = await recomputeSimulation(simId);
    return res.json({ ok: true, simulation: sim });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao remover venda', details: String(err && err.message ? err.message : err) });
  }
}

export async function listSales(req, res) {
  try {
    const { vendedor, razao, cnpj, data } = req.query || {};
    const include = [
      { model: Client, as: 'client' },
      { model: Simulation, as: 'simulation' }
    ];
    let sales = await Sale.findAll({ include, order: [['created_at', 'DESC']] });
    if (req.user && req.user.role === 'user' && req.user.id) {
      sales = sales.filter(s => Number(s.created_by || 0) === Number(req.user.id));
    }
    if (vendedor) {
      sales = sales.filter(s => s.vendedor === vendedor);
    }
    if (razao) {
      const needle = String(razao).trim().toUpperCase();
      sales = sales.filter(s => (s.client?.name || '').toUpperCase().includes(needle));
    }
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, '');
      sales = sales.filter(s => (s.client?.cnpj || '').replace(/\D/g, '').includes(clean));
    }
    if (data) {
      const br = String(data).split('-').reverse().join('/');
      sales = sales.filter(s => (s.simulation?.data || '').includes(br));
    }
    return res.json(sales.map(s => ({
      id: s.id,
      tipo: s.tipo,
      receita: Number(s.receita),
      vendedor: s.vendedor,
      nome: s.client?.name || '',
      cnpj: s.client?.cnpj || '',
      p2b: s.p2b || 0,
      data: s.simulation?.data || ''
    })));
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar vendas', details: String(err && err.message ? err.message : err) });
  }
}
