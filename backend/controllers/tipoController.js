import { Tipo } from '../models/index.js';

export async function listTypes(req, res) {
  try {
    const items = await Tipo.findAll({ order: [['nome', 'ASC']] });
    return res.json(items);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar tipos', details: String(err && err.message ? err.message : err) });
  }
}

export async function createType(req, res) {
  try {
    const { nome, descricao } = req.body || {};
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    const item = await Tipo.create({ nome, descricao: descricao || null });
    return res.status(201).json(item);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar tipo', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateType(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { nome, descricao } = req.body || {};
    const item = await Tipo.findByPk(id);
    if (!item) return res.status(404).json({ error: 'tipo não encontrado' });
    if (nome) item.nome = nome;
    if (descricao !== undefined) item.descricao = descricao || null;
    await item.save();
    return res.json(item);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar tipo', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteType(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const item = await Tipo.findByPk(id);
    if (!item) return res.status(404).json({ error: 'tipo não encontrado' });
    await item.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir tipo', details: String(err && err.message ? err.message : err) });
  }
}
