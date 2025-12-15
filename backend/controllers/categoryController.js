import { Category } from '../models/index.js';

export async function listCategories(req, res) {
  try {
    const cats = await Category.findAll({ order: [['nome', 'ASC']] });
    return res.json(cats);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar categorias', details: String(err && err.message ? err.message : err) });
  }
}

export async function createCategory(req, res) {
  try {
    const { nome, descricao } = req.body || {};
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    const cat = await Category.create({ nome, descricao: descricao || null });
    return res.status(201).json(cat);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar categoria', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateCategory(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { nome, descricao } = req.body || {};
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
    if (nome) cat.nome = nome;
    if (descricao !== undefined) cat.descricao = descricao || null;
    await cat.save();
    return res.json(cat);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar categoria', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteCategory(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const cat = await Category.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
    await cat.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir categoria', details: String(err && err.message ? err.message : err) });
  }
}

