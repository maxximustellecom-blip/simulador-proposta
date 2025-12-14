import { Client } from '../models/index.js';

export async function upsertClient(req, res) {
  try {
    const {
      name, cnpj,
      fantasy_name, email, phone,
      cep, state, city, neighborhood, street, number, complement,
      opening_date
    } = req.body || {};
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'name e cnpj são obrigatórios' });
    }
    const [client] = await Client.findOrCreate({
      where: { cnpj },
      defaults: {
        name, cnpj,
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
        opening_date: opening_date || null
      }
    });
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
    if (changed) await client.save();
    return res.json(client);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao salvar cliente', details: String(err && err.message ? err.message : err) });
  }
}

export async function getClients(req, res) {
  try {
    const { cnpj } = req.query || {};
    const where = {};
    if (cnpj) where.cnpj = cnpj;
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
