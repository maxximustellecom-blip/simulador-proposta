import { Client } from '../models/index.js';

export async function upsertClient(req, res) {
  try {
    const { name, cnpj, p2b } = req.body || {};
    if (!name || !cnpj) {
      return res.status(400).json({ error: 'name e cnpj são obrigatórios' });
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
