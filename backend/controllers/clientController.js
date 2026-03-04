import { Client } from '../models/index.js';
import { Op } from 'sequelize';

export async function upsertClient(req, res) {
  try {
    const {
      name, cnpj,
      fantasy_name, tipo_empresa, email, phone,
      cep, state, city, neighborhood, street, number, complement, reference_point,
      opening_date,
      rep_nome, rep_cpf, rep_rg, rep_tel1, rep_tel2, rep_email,
      gestor_nome, gestor_cpf, gestor_rg, gestor_tel1, gestor_tel2, gestor_email,
      auth1_nome, auth1_cpf, auth1_rg, auth1_contato,
      auth2_nome, auth2_cpf, auth2_contato,
      socio1_nome, socio1_cpf, socio1_contato,
      socio2_nome, socio2_cpf, socio2_contato,
      notes
    } = req.body || {};
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'name e cnpj são obrigatórios' });
    }
    const actor = req.user || null;
    const ownerId = actor && actor.id ? Number(actor.id) : null;
    const [client, created] = await Client.findOrCreate({
      where: { cnpj, created_by: ownerId },
      defaults: {
        name, cnpj,
        created_by: ownerId,
        fantasy_name: fantasy_name || null,
        tipo_empresa: tipo_empresa || null,
        email: email || null,
        phone: phone || null,
        cep: cep || null,
        state: state || null,
        city: city || null,
        neighborhood: neighborhood || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        reference_point: reference_point || null,
        opening_date: opening_date || null,
        rep_nome: rep_nome || null,
        rep_cpf: rep_cpf || null,
        rep_rg: rep_rg || null,
        rep_tel1: rep_tel1 || null,
        rep_tel2: rep_tel2 || null,
        rep_email: rep_email || null,
        gestor_nome: gestor_nome || null,
        gestor_cpf: gestor_cpf || null,
        gestor_rg: gestor_rg || null,
        gestor_tel1: gestor_tel1 || null,
        gestor_tel2: gestor_tel2 || null,
        gestor_email: gestor_email || null,
        auth1_nome: auth1_nome || null,
        auth1_cpf: auth1_cpf || null,
        auth1_rg: auth1_rg || null,
        auth1_contato: auth1_contato || null,
        auth2_nome: auth2_nome || null,
        auth2_cpf: auth2_cpf || null,
        auth2_contato: auth2_contato || null,
        socio1_nome: socio1_nome || null,
        socio1_cpf: socio1_cpf || null,
        socio1_contato: socio1_contato || null,
        socio2_nome: socio2_nome || null,
        socio2_cpf: socio2_cpf || null,
        socio2_contato: socio2_contato || null,
        notes: notes || null
      }
    });
    if (!created) {
      const isAdmin = actor && actor.role === 'admin';
      const isOwner = actor && actor.id && Number(client.created_by || 0) === Number(actor.id);
      if (!isAdmin && !isOwner) {
        return res.status(403).json({ error: 'forbidden' });
      }
    }
    // Caso seja admin criando com ownerId null, mantém null (admin-owned)
    let changed = false;
    if (client.name !== name) { client.name = name; changed = true; }
    if (client.fantasy_name !== (fantasy_name || null)) { client.fantasy_name = fantasy_name || null; changed = true; }
    if (client.tipo_empresa !== (tipo_empresa || null)) { client.tipo_empresa = tipo_empresa || null; changed = true; }
    if (client.email !== (email || null)) { client.email = email || null; changed = true; }
    if (client.phone !== (phone || null)) { client.phone = phone || null; changed = true; }
    if (client.cep !== (cep || null)) { client.cep = cep || null; changed = true; }
    if (client.state !== (state || null)) { client.state = state || null; changed = true; }
    if (client.city !== (city || null)) { client.city = city || null; changed = true; }
    if (client.neighborhood !== (neighborhood || null)) { client.neighborhood = neighborhood || null; changed = true; }
    if (client.street !== (street || null)) { client.street = street || null; changed = true; }
    if (client.number !== (number || null)) { client.number = number || null; changed = true; }
    if (client.complement !== (complement || null)) { client.complement = complement || null; changed = true; }
    if (client.reference_point !== (reference_point || null)) { client.reference_point = reference_point || null; changed = true; }
    if (client.opening_date !== (opening_date || null)) { client.opening_date = opening_date || null; changed = true; }
    if (client.rep_nome !== (rep_nome || null)) { client.rep_nome = rep_nome || null; changed = true; }
    if (client.rep_cpf !== (rep_cpf || null)) { client.rep_cpf = rep_cpf || null; changed = true; }
    if (client.rep_rg !== (rep_rg || null)) { client.rep_rg = rep_rg || null; changed = true; }
    if (client.rep_tel1 !== (rep_tel1 || null)) { client.rep_tel1 = rep_tel1 || null; changed = true; }
    if (client.rep_tel2 !== (rep_tel2 || null)) { client.rep_tel2 = rep_tel2 || null; changed = true; }
    if (client.rep_email !== (rep_email || null)) { client.rep_email = rep_email || null; changed = true; }
    if (client.gestor_nome !== (gestor_nome || null)) { client.gestor_nome = gestor_nome || null; changed = true; }
    if (client.gestor_cpf !== (gestor_cpf || null)) { client.gestor_cpf = gestor_cpf || null; changed = true; }
    if (client.gestor_rg !== (gestor_rg || null)) { client.gestor_rg = gestor_rg || null; changed = true; }
    if (client.gestor_tel1 !== (gestor_tel1 || null)) { client.gestor_tel1 = gestor_tel1 || null; changed = true; }
    if (client.gestor_tel2 !== (gestor_tel2 || null)) { client.gestor_tel2 = gestor_tel2 || null; changed = true; }
    if (client.gestor_email !== (gestor_email || null)) { client.gestor_email = gestor_email || null; changed = true; }
    if (client.auth1_nome !== (auth1_nome || null)) { client.auth1_nome = auth1_nome || null; changed = true; }
    if (client.auth1_cpf !== (auth1_cpf || null)) { client.auth1_cpf = auth1_cpf || null; changed = true; }
    if (client.auth1_rg !== (auth1_rg || null)) { client.auth1_rg = auth1_rg || null; changed = true; }
    if (client.auth1_contato !== (auth1_contato || null)) { client.auth1_contato = auth1_contato || null; changed = true; }
    if (client.auth2_nome !== (auth2_nome || null)) { client.auth2_nome = auth2_nome || null; changed = true; }
    if (client.auth2_cpf !== (auth2_cpf || null)) { client.auth2_cpf = auth2_cpf || null; changed = true; }
    if (client.auth2_contato !== (auth2_contato || null)) { client.auth2_contato = auth2_contato || null; changed = true; }
    if (client.socio1_nome !== (socio1_nome || null)) { client.socio1_nome = socio1_nome || null; changed = true; }
    if (client.socio1_cpf !== (socio1_cpf || null)) { client.socio1_cpf = socio1_cpf || null; changed = true; }
    if (client.socio1_contato !== (socio1_contato || null)) { client.socio1_contato = socio1_contato || null; changed = true; }
    if (client.socio2_nome !== (socio2_nome || null)) { client.socio2_nome = socio2_nome || null; changed = true; }
    if (client.socio2_cpf !== (socio2_cpf || null)) { client.socio2_cpf = socio2_cpf || null; changed = true; }
    if (client.socio2_contato !== (socio2_contato || null)) { client.socio2_contato = socio2_contato || null; changed = true; }
    if (client.notes !== (notes || null)) { client.notes = notes || null; changed = true; }
    if (changed) await client.save();
    return res.json(client);
  } catch (err) {
    console.error('Error saving client:', err);
    return res.status(500).json({ 
      error: 'erro ao salvar cliente', 
      details: err.message || String(err),
      validationErrors: err.errors ? err.errors.map(e => ({ message: e.message, path: e.path, value: e.value })) : []
    });
  }
}

export async function updateClient(req, res) {
  try {
    const id = Number(req.params.id);
    const actor = req.user;
    if (!id) return res.status(400).json({ error: 'id required' });

    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ error: 'not found' });

    const isAdmin = actor && actor.role === 'admin';
    const isOwner = actor && actor.id && Number(client.created_by || 0) === Number(actor.id);
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'forbidden' });
    }

    const fields = req.body || {};
    Object.keys(fields).forEach(key => {
        // Prevent changing immutable fields or sensitive ones if necessary
        if (key !== 'id' && key !== 'created_by' && key !== 'createdAt' && key !== 'updatedAt') {
             client[key] = fields[key];
        }
    });
    
    await client.save();
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar cliente', details: String(err && err.message ? err.message : err) });
  }
}

export async function getClients(req, res) {
  try {
    const { cnpj, user_id } = req.query || {};
    const and = [{ cnpj: { [Op.ne]: '00000000000000' } }];
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, '');
      if (clean) {
        if (clean.length === 14) {
          and.push({ cnpj: clean });
        } else {
          and.push({ cnpj: { [Op.like]: `%${clean}%` } });
        }
      }
    }
    const actor = req.user || null;
    if (!actor || actor.role !== 'admin') {
      and.push({ created_by: actor && actor.id ? Number(actor.id) : -1 });
    } else {
      if (user_id) {
        const uid = Number(user_id);
        if (uid) and.push({ created_by: uid });
      }
    }
    const where = { [Op.and]: and };
    const clients = await Client.findAll({ where, order: [['name', 'ASC']] });
    return res.json(clients);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar clientes', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteClient(req, res) {
  try {
    const actor = req.user;
    if (!actor || actor.role !== 'admin') {
      return res.status(403).json({ error: 'forbidden' });
    }
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const client = await Client.findByPk(id);
    if (!client) return res.status(404).json({ error: 'cliente não encontrado' });
    await client.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao remover cliente', details: String(err && err.message ? err.message : err) });
  }
}
