import { Client, Simulation, Sale } from '../models/index.js';

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

export async function updateSale(req, res) {
  try {
    const { id } = req.params;
    const { tipo, receita, vendedor, p2b } = req.body || {};
    const sale = await Sale.findByPk(id, { include: [{ model: Client, as: 'client' }] });
    if (!sale) return res.status(404).json({ error: 'venda não encontrada' });
    if (tipo) sale.tipo = tipo;
    if (receita !== undefined) sale.receita = Number(receita || 0);
    if (vendedor) sale.vendedor = vendedor;
    if (p2b !== undefined && sale.client) {
      sale.client.p2b = Number(p2b || 0);
      await sale.client.save();
    }
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
      p2b: s.client?.p2b || 0,
      data: s.simulation?.data || ''
    })));
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar vendas', details: String(err && err.message ? err.message : err) });
  }
}
