import { Client, Simulation, Sale } from '../models/index.js';

function calcularNivel(receitaTotal) {
  if (receitaTotal < 700) return { nome: 'BLUE', fator: 0.6, cor: '#3182ce' };
  if (receitaTotal < 900) return { nome: 'SILVER', fator: 0.8, cor: '#a0aec0' };
  if (receitaTotal < 1500) return { nome: 'PLATINUM', fator: 1.0, cor: '#805ad5' };
  if (receitaTotal < 1900) return { nome: 'BLACK', fator: 1.5, cor: '#2d3748' };
  return { nome: 'BLACK+', fator: 2.0, cor: '#000000' };
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

export async function createSimulation(req, res) {
  try {
    const { cliente, vendas } = req.body || {};
    if (!cliente || !vendas || !Array.isArray(vendas) || vendas.length === 0) {
      return res.status(400).json({ error: 'payload inválido: cliente e vendas são obrigatórios' });
    }
    const { name, cnpj, p2b } = cliente;
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'cliente inválido: name e cnpj são obrigatórios' });
    }
    const [client] = await Client.findOrCreate({
      where: { cnpj },
      defaults: { name, cnpj, p2b: Number(p2b || 0) }
    });
    if (client.name !== name || client.p2b !== Number(p2b || 0)) {
      client.name = name;
      client.p2b = Number(p2b || 0);
      await client.save();
    }
    const receitaNovos = vendas.filter(v => v.tipo === 'novos').reduce((acc, v) => acc + Number(v.receita || 0), 0);
    const receitaTotal = vendas.reduce((acc, v) => acc + Number(v.receita || 0), 0);
    const nivel = calcularNivel(receitaNovos);
    const detalhes = vendas.map(v => ({
      ...v,
      comissao: calcularComissaoProduto(receitaNovos, v.tipo, Number(v.receita || 0))
    }));
    const comissaoTotal = detalhes.reduce((acc, d) => acc + Number(d.comissao || 0), 0);
    const data = new Date().toLocaleString('pt-BR');
    const simulation = await Simulation.create({
      data,
      receita_novos: receitaNovos,
      receita_total: receitaTotal,
      nivel_nome: nivel.nome,
      nivel_fator: nivel.fator,
      comissao_total: comissaoTotal,
      created_by: req.user?.id || null
    });
    const salesPayload = vendas.map(v => ({
      tipo: v.tipo,
      receita: Number(v.receita || 0),
      vendedor: v.vendedor || '-',
      client_id: client.id,
      simulation_id: simulation.id,
      created_by: req.user?.id || null
    }));
    await Sale.bulkCreate(salesPayload);
    const createdSales = await Sale.findAll({ where: { simulation_id: simulation.id }, include: [{ model: Client, as: 'client' }] });
    return res.json({
      id: simulation.id,
      data: simulation.data,
      vendas: createdSales.map(s => ({
        id: s.id,
        tipo: s.tipo,
        receita: Number(s.receita),
        vendedor: s.vendedor,
        nome: s.client?.name || '',
        cnpj: s.client?.cnpj || '',
        p2b: s.client?.p2b || 0
      })),
      receitaNovos,
      receitaTotal,
      nivel,
      comissaoTotal
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar simulação', details: String(err && err.message ? err.message : err) });
  }
}

export async function listSimulations(req, res) {
  try {
    const { vendedor, razao, cnpj, data } = req.query || {};
    let sims = await Simulation.findAll({
      order: [['created_at', 'DESC']],
      include: [{ model: Sale, as: 'sales', include: [{ model: Client, as: 'client' }] }]
    });
    if (req.user && req.user.role === 'user' && req.user.id) {
      sims = sims.filter(sim => Number(sim.created_by || 0) === Number(req.user.id));
    }
    let result = sims.map(sim => ({
      id: sim.id,
      data: sim.data,
      vendas: sim.sales
        .filter(s => {
          if (req.user && req.user.role === 'user' && req.user.id) {
            return Number(s.created_by || 0) === Number(req.user.id);
          }
          return true;
        })
        .map(s => ({
        id: s.id,
        tipo: s.tipo,
        receita: Number(s.receita),
        vendedor: s.vendedor,
        nome: s.client?.name || '',
        cnpj: s.client?.cnpj || '',
        p2b: s.client?.p2b || 0
      })),
      receitaNovos: Number(sim.receita_novos),
      receitaTotal: Number(sim.receita_total),
      nivel: { nome: sim.nivel_nome, fator: Number(sim.nivel_fator) },
      comissaoTotal: Number(sim.comissao_total)
    }));
    if (vendedor) {
      result = result.map(sim => ({
        ...sim,
        vendas: sim.vendas.filter(v => v.vendedor === vendedor)
      })).filter(sim => sim.vendas.length > 0);
    }
    if (razao) {
      const needle = String(razao).trim().toUpperCase();
      result = result.map(sim => ({
        ...sim,
        vendas: sim.vendas.filter(v => (v.nome || '').toUpperCase().includes(needle))
      })).filter(sim => sim.vendas.length > 0);
    }
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, '');
      result = result.map(sim => ({
        ...sim,
        vendas: sim.vendas.filter(v => (v.cnpj || '').replace(/\D/g, '').includes(clean))
      })).filter(sim => sim.vendas.length > 0);
    }
    if (data) {
      const iso = String(data);
      const br = iso.split('-').reverse().join('/');
      result = result.filter(sim => (sim.data || '').includes(br));
    }
    return res.json(result);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar simulações', details: String(err && err.message ? err.message : err) });
  }
}
