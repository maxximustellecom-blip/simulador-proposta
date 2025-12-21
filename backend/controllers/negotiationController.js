import { Negotiation, User, PedidoDeVenda } from '../models/index.js';

function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }

export async function listNegotiations(req, res) {
  try {
    const { cnpj, status, data } = req.query || {};
    let list = await Negotiation.findAll({
      include: [{ model: User, as: 'creator', attributes: ['id', 'name'] }],
      order: [['created_at', 'DESC']]
    });
    if (req.user && req.user.role === 'user' && req.user.id) {
      list = list.filter(n => Number(n.created_by || 0) === Number(req.user.id));
    }
    if (cnpj) {
      const needle = onlyDigits(cnpj);
      list = list.filter(n => onlyDigits(n.cnpj || '').includes(needle));
    }
    if (status && status !== 'Todos') {
      const s = String(status);
      list = list.filter(n => String(n.status || '') === s);
    }
    if (data) {
      const br = String(data).split('-').reverse().join('/');
      list = list.filter(n => String(n.data || '').includes(br));
    }
    return res.json(list.map(n => ({
      id: n.id,
      cnpj: n.cnpj,
      tipo: n.tipo,
      proposta: n.proposta,
      valor: n.valor !== null && n.valor !== undefined ? Number(n.valor) : null,
      status: n.status,
      data: n.data,
      created_by: n.created_by !== null && n.created_by !== undefined ? Number(n.created_by) : null,
      creator: n.creator ? { id: n.creator.id, name: n.creator.name } : null
    })));
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar negociações', details: String(err && err.message ? err.message : err) });
  }
}

export async function createNegotiation(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'unauthorized: usuário não autenticado' });
    }
    const { cnpj, tipo, proposta, valor, status, data } = req.body || {};
    const cleanCnpj = onlyDigits(cnpj);
    if (!cleanCnpj || !tipo || !proposta) {
      return res.status(400).json({ error: 'cnpj, tipo e proposta são obrigatórios' });
    }
    const negotiation = await Negotiation.create({
      cnpj: cleanCnpj,
      tipo,
      proposta,
      valor: valor !== undefined ? Number(valor || 0) : null,
      status: status || 'Em andamento',
      data: data ? String(data).split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR'),
      created_by: req.user.id
    });

    await PedidoDeVenda.create({
      negotiation_id: negotiation.id,
      status: status || 'Em andamento'
    });

    return res.status(201).json({
      id: negotiation.id,
      cnpj: negotiation.cnpj,
      tipo: negotiation.tipo,
      proposta: negotiation.proposta,
      valor: negotiation.valor !== null && negotiation.valor !== undefined ? Number(negotiation.valor) : null,
      status: negotiation.status,
      data: negotiation.data
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar negociação', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    const actor = req.user;
    if (!actor || (actor.role !== 'admin' && Number(negotiation.created_by || 0) !== Number(actor.id))) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const { cnpj, tipo, proposta, valor, status, data } = req.body || {};
    if (cnpj !== undefined) negotiation.cnpj = onlyDigits(cnpj);
    if (tipo) negotiation.tipo = tipo;
    if (proposta) negotiation.proposta = proposta;
    if (valor !== undefined) negotiation.valor = Number(valor || 0);
    if (status) negotiation.status = status;
    if (data) negotiation.data = String(data).includes('-') ? String(data).split('-').reverse().join('/') : String(data);
    await negotiation.save();

    // Se o status foi atualizado, reflete no PedidoDeVenda
    if (status) {
      const pedido = await PedidoDeVenda.findOne({ where: { negotiation_id: negotiation.id } });
      if (pedido) {
        pedido.status = status;
        await pedido.save();
      }
    }

    return res.json({
      id: negotiation.id,
      cnpj: negotiation.cnpj,
      tipo: negotiation.tipo,
      proposta: negotiation.proposta,
      valor: negotiation.valor !== null && negotiation.valor !== undefined ? Number(negotiation.valor) : null,
      status: negotiation.status,
      data: negotiation.data
    });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar negociação', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteNegotiation(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    const actor = req.user;
    if (!actor || (actor.role !== 'admin' && Number(negotiation.created_by || 0) !== Number(actor.id))) {
      return res.status(403).json({ error: 'forbidden' });
    }
    await negotiation.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir negociação', details: String(err && err.message ? err.message : err) });
  }
}
