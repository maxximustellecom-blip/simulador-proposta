import { Negotiation, User, Client, PedidoDeVenda, NegociacaoProposta, NegociacaoPropostaCustomizada } from '../models/index.js';

function onlyDigits(s) { return String(s || '').replace(/\D/g, ''); }
function toAcc(n) {
  if (!n) return 0;
  if (n.customProposal && n.customProposal.total_acessos !== undefined && n.customProposal.total_acessos !== null) return Number(n.customProposal.total_acessos) || 0;
  if (n.proposal && n.proposal.total_acessos !== undefined && n.proposal.total_acessos !== null) return Number(n.proposal.total_acessos) || 0;
  return 0;
}
function dedupeById(list) {
  const map = new Map();
  for (const item of (Array.isArray(list) ? list : [])) {
    const id = Number(item && item.id ? item.id : 0);
    if (!id) continue;
    const prev = map.get(id);
    if (!prev) { map.set(id, item); continue; }
    const prevScore = (prev.client ? 2 : 0) + (prev.creator ? 1 : 0) + ((prev.proposal || prev.customProposal) ? 1 : 0);
    const nextScore = (item.client ? 2 : 0) + (item.creator ? 1 : 0) + ((item.proposal || item.customProposal) ? 1 : 0);
    if (nextScore > prevScore) { map.set(id, item); continue; }
    if (nextScore === prevScore) {
      const pAcc = toAcc(prev);
      const nAcc = toAcc(item);
      if (nAcc > pAcc) { map.set(id, item); continue; }
      const pCid = Number(prev.client && prev.client.id ? prev.client.id : 0);
      const nCid = Number(item.client && item.client.id ? item.client.id : 0);
      if (nCid > pCid) { map.set(id, item); }
    }
  }
  return Array.from(map.values());
}

export async function listNegotiations(req, res) {
  try {
    const { cnpj, status, data, creator_id, razao, tipo_proposta } = req.query || {};
    let list = await Negotiation.findAll({
      include: [
        { 
          model: User, 
          as: 'creator', 
          attributes: ['id', 'name', 'email', 'celular', 'role'],
          where: (req.query.only_users === 'true') ? { role: 'user' } : undefined,
          required: (req.query.only_users === 'true')
        },
        { model: Client, as: 'client' },
        { model: NegociacaoProposta, as: 'proposal', attributes: ['total_acessos'] },
        { model: NegociacaoPropostaCustomizada, as: 'customProposal', attributes: ['total_acessos'] }
      ],
      order: [['created_at', 'DESC']],
      distinct: true
    });
    list = dedupeById(list);
    const role = String(req.user && req.user.role ? req.user.role : '').toLowerCase();
    if (req.user && role === 'user' && req.user.id) {
      list = list.filter(n => Number(n.created_by || 0) === Number(req.user.id));
    } else if (creator_id) {
      // If admin and creator_id filter provided
      list = list.filter(n => Number(n.created_by || 0) === Number(creator_id));
    }

    if (tipo_proposta) {
      const tp = String(tipo_proposta).toUpperCase();
      if (tp.includes('PADRAO') || tp.includes('PADRÃO')) {
         list = list.filter(n => {
             const p = String(n.proposta || '').toUpperCase();
             return p.includes('PADRAO') || p.includes('PADRÃO');
         });
      } else if (tp.includes('CUSTOMIZADA')) {
         list = list.filter(n => {
             const p = String(n.proposta || '').toUpperCase();
             return !p.includes('PADRAO') && !p.includes('PADRÃO');
         });
      }
    }

    if (cnpj) {
      const needle = onlyDigits(cnpj);
      list = list.filter(n => onlyDigits(n.cnpj || '').includes(needle));
    }
    if (razao) {
      const normalize = (s) => String(s || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const needle = normalize(razao).trim();
      list = list.filter(n => {
        const name = normalize(n.client?.name);
        const fantasy = normalize(n.client?.fantasy_name);
        return name.includes(needle) || fantasy.includes(needle);
      });
    }
    if (status && status !== 'Todos') {
      const s = String(status);
      list = list.filter(n => String(n.status || '') === s);
    }
    if (data) {
      const br = String(data).split('-').reverse().join('/');
      list = list.filter(n => String(n.data || '').includes(br));
    }
    return res.json(list.map(n => {
      const totalAcessos = n.customProposal ? n.customProposal.total_acessos : (n.proposal ? n.proposal.total_acessos : 0);
      return {
        id: n.id,
        cnpj: n.cnpj,
        tipo: n.tipo,
        proposta: n.proposta,
        valor: n.valor !== null && n.valor !== undefined ? Number(n.valor) : null,
        status: n.status,
        funil_stage: Number(n.funil_stage || 1),
        fatura_due_date: n.fatura_due_date || null,
        data: n.data,
        created_by: n.created_by !== null && n.created_by !== undefined ? Number(n.created_by) : null,
        creator: n.creator ? { id: n.creator.id, name: n.creator.name, email: n.creator.email || null, celular: n.creator.celular || null } : null,
        razaoSocial: n.client ? (n.client.name || '') : '',
        totalAcessos
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar negociações', details: String(err && err.message ? err.message : err) });
  }
}

export async function listFunnelNegotiations(req, res) {
  try {
    let list = await Negotiation.findAll({
      include: [
        { model: User, as: 'creator', attributes: ['id', 'name', 'email', 'celular', 'role'] },
        { model: Client, as: 'client' },
        { model: NegociacaoProposta, as: 'proposal', attributes: ['total_acessos'] },
        { model: NegociacaoPropostaCustomizada, as: 'customProposal', attributes: ['total_acessos'] }
      ],
      order: [['created_at', 'DESC']],
      distinct: true
    });
    list = dedupeById(list);
    const role = String(req.user && req.user.role ? req.user.role : '').toLowerCase();
    if (req.user && role === 'user' && req.user.id) {
      list = list.filter(n => Number(n.created_by || 0) === Number(req.user.id));
    }
    return res.json(list.map(n => {
      const totalAcessos = n.customProposal ? n.customProposal.total_acessos : (n.proposal ? n.proposal.total_acessos : 0);
      return {
        id: n.id,
        funil_stage: Number(n.funil_stage || 1),
        cnpj: n.cnpj,
        tipo: n.tipo,
        proposta: n.proposta,
        valor: n.valor !== null && n.valor !== undefined ? Number(n.valor) : null,
        status: n.status,
        fatura_due_date: n.fatura_due_date || null,
        data: n.data,
        created_at: n.created_at,
        created_by: n.created_by !== null && n.created_by !== undefined ? Number(n.created_by) : null,
        creator: n.creator ? { id: n.creator.id, name: n.creator.name, email: n.creator.email || null, celular: n.creator.celular || null } : null,
        client: n.client ? {
          id: n.client.id,
          name: n.client.name || '',
          fantasy_name: n.client.fantasy_name || '',
          email: n.client.email || '',
          phone: n.client.phone || '',
          due_date: n.client.due_date || null
        } : null,
        totalAcessos
      };
    }));
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar funil', details: String(err && err.message ? err.message : err) });
  }
}

export async function createNegotiation(req, res) {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'unauthorized: usuário não autenticado' });
    }
    const { cnpj, tipo, proposta, valor, status, data, fatura_due_date } = req.body || {};
    const cleanCnpj = onlyDigits(cnpj);
    if (!cleanCnpj || !tipo || !proposta) {
      return res.status(400).json({ error: 'cnpj, tipo e proposta são obrigatórios' });
    }
    
    // Determine creator: if admin and creator_id provided, use it; otherwise use current user
    let creatorId = req.user.id;
    if (req.user.role === 'admin' && req.body.creator_id) {
      creatorId = Number(req.body.creator_id);
    }

    const negotiation = await Negotiation.create({
      cnpj: cleanCnpj,
      tipo,
      proposta,
      valor: valor !== undefined ? Number(valor || 0) : null,
      status: status || 'Em andamento',
      funil_stage: 1,
      fatura_due_date: fatura_due_date ? (String(fatura_due_date).includes('-') ? String(fatura_due_date).split('-').reverse().join('/') : String(fatura_due_date)) : null,
      data: data ? String(data).split('-').reverse().join('/') : new Date().toLocaleDateString('pt-BR'),
      created_by: creatorId
    });

    await PedidoDeVenda.create({
      negotiation_id: negotiation.id,
      status: 'Pendente'
    });

    return res.status(201).json({
      id: negotiation.id,
      cnpj: negotiation.cnpj,
      tipo: negotiation.tipo,
      proposta: negotiation.proposta,
      valor: negotiation.valor !== null && negotiation.valor !== undefined ? Number(negotiation.valor) : null,
      status: negotiation.status,
      fatura_due_date: negotiation.fatura_due_date || null,
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
    const { cnpj, tipo, proposta, valor, status, data, funil_stage, fatura_due_date } = req.body || {};
    if (cnpj !== undefined) negotiation.cnpj = onlyDigits(cnpj);
    if (tipo) negotiation.tipo = tipo;
    if (proposta) negotiation.proposta = proposta;
    if (valor !== undefined) negotiation.valor = Number(valor || 0);
    if (status) negotiation.status = status;
    if (fatura_due_date !== undefined) {
      const v = String(fatura_due_date || '').trim();
      negotiation.fatura_due_date = v ? (v.includes('-') ? v.split('-').reverse().join('/') : v) : null;
    }
    if (funil_stage !== undefined) {
      const s = Number(funil_stage);
      if (isFinite(s)) {
        const bounded = Math.max(1, Math.min(5, Math.trunc(s)));
        negotiation.funil_stage = bounded;
      }
    }
    if (data) negotiation.data = String(data).includes('-') ? String(data).split('-').reverse().join('/') : String(data);
    
    // Allow admin to update creator
    if (req.user.role === 'admin' && req.body.creator_id) {
      negotiation.created_by = Number(req.body.creator_id);
    }

    await negotiation.save();

    // Se o status foi atualizado, reflete no PedidoDeVenda
    if (status) {
      const pedido = await PedidoDeVenda.findOne({ where: { negotiation_id: negotiation.id } });
      if (pedido) {
        const s = String(status).toLowerCase();
        if (s === 'concluída' || s === 'concluida') {
          pedido.status = 'Entrada';
          if (!pedido.data_entrada) {
             pedido.data_entrada = new Date().toLocaleDateString('pt-BR');
          }
        } else {
          pedido.status = status;
        }
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
      fatura_due_date: negotiation.fatura_due_date || null,
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
    await PedidoDeVenda.destroy({ where: { negotiation_id: negotiation.id } });
    await negotiation.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir negociação', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateFunnelStage(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const negotiation = await Negotiation.findByPk(id);
    if (!negotiation) return res.status(404).json({ error: 'negociação não encontrada' });
    const actor = req.user;
    if (!actor || (actor.role !== 'admin' && Number(negotiation.created_by || 0) !== Number(actor.id))) {
      return res.status(403).json({ error: 'forbidden' });
    }
    const stage = Number((req.body || {}).funil_stage);
    if (!isFinite(stage)) return res.status(400).json({ error: 'funil_stage inválido' });
    const bounded = Math.max(1, Math.min(5, Math.trunc(stage)));
    negotiation.funil_stage = bounded;
    await negotiation.save();
    return res.json({ id: negotiation.id, funil_stage: Number(negotiation.funil_stage || 1) });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar funil', details: String(err && err.message ? err.message : err) });
  }
}
