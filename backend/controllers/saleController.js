import { Client, Simulation, Sale, Negotiation, User, AccessProfile, NegociacaoProposta, NegociacaoPropostaCustomizada, PedidoDeVenda } from '../models/index.js';

function parsePercentage(str) {
  if (typeof str === 'number') return str;
  if (!str) return 0;
  return parseFloat(String(str).replace('%', '').replace(',', '.')) / 100;
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

function mapProductToGroup(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('novo') || t.includes('aditivo')) return 'novo';
  if (t.includes('renovação') || t.includes('migracao pf-pj') || t.includes('tt')) return 'reneg';
  if (t.includes('ultra fibra') || t.includes('wttx') || t.includes('m2m')) return 'fibra';
  if (t.includes('controle pf')) return 'tim';
  return 'novo'; // Default
}

function mapProductToCommissionKey(tipo) {
  const t = String(tipo || '').toLowerCase();
  if (t.includes('novo')) return 'novo';
  if (t.includes('aditivo')) return 'aditivo';
  if (t.includes('portabilidade')) return 'portabilidade';
  if (t.includes('renovação')) return 'renovacao';
  if (t.includes('ultra fibra')) return 'ultra_fibra';
  if (t.includes('wttx')) return 'wttx';
  if (t.includes('m2m')) return 'm2m';
  if (t.includes('controle pf')) return 'controle';
  if (t.includes('migracao pf-pj')) return 'migracao';
  if (t.includes('tt')) return 'tt';
  return 'novo';
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
      
      // Calculate level based on ATIVAS (Novo + Aditivo) in the period
      const ativasNovosRec = userNegs.reduce((acc, n) => {
        if (n.pedidoDeVenda && n.pedidoDeVenda.status === '7-Contratos Ativos') {
          const group = mapProductToGroup(n.tipo);
          if (group === 'novo') return acc + Number(n.valor || 0);
        }
        return acc;
      }, 0);

      const level = calcularNivel(ativasNovosRec);
      const config = user.profile && user.profile.commission_config ? (typeof user.profile.commission_config === 'string' ? JSON.parse(user.profile.commission_config) : user.profile.commission_config) : null;
      
      const stats = {
        name: user.name,
        novo: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        reneg: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        fibra: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } },
        tim: { ent: { qtd: 0, rec: 0 }, at: { qtd: 0, rec: 0 } }
      };

      userNegs.forEach(n => {
        const group = mapProductToGroup(n.tipo);
        const isAtiva = n.pedidoDeVenda && n.pedidoDeVenda.status === '7-Contratos Ativos';
        const isEntrante = n.status === 'Em andamento' && !isAtiva;
        
        if (!isAtiva && !isEntrante) return;

        // Process proposal items to calculate commission
        let totalCommission = 0;
        let qtd = 0;
        
        const lines = n.proposal ? n.proposal.linhas : (n.customProposal ? n.customProposal.linhas : []);
        const linesArr = Array.isArray(lines) ? lines : [];

        linesArr.forEach(l => {
          const q = Number(l.quantidade || 1);
          qtd += q;
          const itemVal = Number(l.valorPlano || 0) * q;
          
          // Determine rate from profile config
          let rate = 0;
          if (config && config.products) {
            const levelConfig = config.products.find(p => p.level_group === level.nome);
            if (levelConfig) {
              const key = mapProductToCommissionKey(l.tipo || n.tipo);
              rate = parsePercentage(levelConfig[key]);
            }
          } else {
            // Fallback to default rates if no profile config
            const fallbackRate = (calcularComissaoProduto(ativasNovosRec, mapProductToCommissionKey(l.tipo || n.tipo), 100) / 100);
            rate = fallbackRate;
          }
          totalCommission += itemVal * rate;
        });

        const target = isAtiva ? stats[group].at : stats[group].ent;
        target.qtd += qtd;
        target.rec += totalCommission;
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
