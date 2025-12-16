import { Client } from '../models/index.js';
import { Op } from 'sequelize';

export async function upsertClient(req, res) {
  try {
    const {
      name, cnpj,
      fantasy_name, email, phone,
      cep, state, city, neighborhood, street, number, complement,
      opening_date,
      rep_nome, rep_cpf, rep_rg, rep_tel1, rep_tel2,
      gestor_nome, gestor_cpf, gestor_rg, gestor_tel1, gestor_tel2,
      auth1_nome, auth1_cpf, auth1_rg, auth1_contato,
      auth2_nome, auth2_cpf, auth2_contato
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
        email: email || null,
        phone: phone || null,
        cep: cep || null,
        state: state || null,
        city: city || null,
        neighborhood: neighborhood || null,
        street: street || null,
        number: number || null,
        complement: complement || null,
        opening_date: opening_date || null,
        rep_nome: rep_nome || null,
        rep_cpf: rep_cpf || null,
        rep_rg: rep_rg || null,
        rep_tel1: rep_tel1 || null,
        rep_tel2: rep_tel2 || null,
        gestor_nome: gestor_nome || null,
        gestor_cpf: gestor_cpf || null,
        gestor_rg: gestor_rg || null,
        gestor_tel1: gestor_tel1 || null,
        gestor_tel2: gestor_tel2 || null,
        auth1_nome: auth1_nome || null,
        auth1_cpf: auth1_cpf || null,
        auth1_rg: auth1_rg || null,
        auth1_contato: auth1_contato || null,
        auth2_nome: auth2_nome || null,
        auth2_cpf: auth2_cpf || null,
        auth2_contato: auth2_contato || null
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
    if (client.email !== (email || null)) { client.email = email || null; changed = true; }
    if (client.phone !== (phone || null)) { client.phone = phone || null; changed = true; }
    if (client.cep !== (cep || null)) { client.cep = cep || null; changed = true; }
    if (client.state !== (state || null)) { client.state = state || null; changed = true; }
    if (client.city !== (city || null)) { client.city = city || null; changed = true; }
    if (client.neighborhood !== (neighborhood || null)) { client.neighborhood = neighborhood || null; changed = true; }
    if (client.street !== (street || null)) { client.street = street || null; changed = true; }
    if (client.number !== (number || null)) { client.number = number || null; changed = true; }
    if (client.complement !== (complement || null)) { client.complement = complement || null; changed = true; }
    if (client.opening_date !== (opening_date || null)) { client.opening_date = opening_date || null; changed = true; }
    if (client.rep_nome !== (rep_nome || null)) { client.rep_nome = rep_nome || null; changed = true; }
    if (client.rep_cpf !== (rep_cpf || null)) { client.rep_cpf = rep_cpf || null; changed = true; }
    if (client.rep_rg !== (rep_rg || null)) { client.rep_rg = rep_rg || null; changed = true; }
    if (client.rep_tel1 !== (rep_tel1 || null)) { client.rep_tel1 = rep_tel1 || null; changed = true; }
    if (client.rep_tel2 !== (rep_tel2 || null)) { client.rep_tel2 = rep_tel2 || null; changed = true; }
    if (client.gestor_nome !== (gestor_nome || null)) { client.gestor_nome = gestor_nome || null; changed = true; }
    if (client.gestor_cpf !== (gestor_cpf || null)) { client.gestor_cpf = gestor_cpf || null; changed = true; }
    if (client.gestor_rg !== (gestor_rg || null)) { client.gestor_rg = gestor_rg || null; changed = true; }
    if (client.gestor_tel1 !== (gestor_tel1 || null)) { client.gestor_tel1 = gestor_tel1 || null; changed = true; }
    if (client.gestor_tel2 !== (gestor_tel2 || null)) { client.gestor_tel2 = gestor_tel2 || null; changed = true; }
    if (client.auth1_nome !== (auth1_nome || null)) { client.auth1_nome = auth1_nome || null; changed = true; }
    if (client.auth1_cpf !== (auth1_cpf || null)) { client.auth1_cpf = auth1_cpf || null; changed = true; }
    if (client.auth1_rg !== (auth1_rg || null)) { client.auth1_rg = auth1_rg || null; changed = true; }
    if (client.auth1_contato !== (auth1_contato || null)) { client.auth1_contato = auth1_contato || null; changed = true; }
    if (client.auth2_nome !== (auth2_nome || null)) { client.auth2_nome = auth2_nome || null; changed = true; }
    if (client.auth2_cpf !== (auth2_cpf || null)) { client.auth2_cpf = auth2_cpf || null; changed = true; }
    if (client.auth2_contato !== (auth2_contato || null)) { client.auth2_contato = auth2_contato || null; changed = true; }
    if (changed) await client.save();
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao salvar cliente', details: String(err && err.message ? err.message : err) });
  }
}

export async function getClients(req, res) {
  try {
    const { cnpj } = req.query || {};
    const and = [{ cnpj: { [Op.ne]: '00000000000000' } }];
    if (cnpj) {
      const clean = String(cnpj).replace(/\D/g, '');
      and.push({ cnpj: clean });
    }
    const actor = req.user || null;
    if (!actor || actor.role !== 'admin') {
      and.push({ created_by: actor && actor.id ? Number(actor.id) : -1 });
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
