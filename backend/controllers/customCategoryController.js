import { CustomCategory } from '../models/index.js';

export async function listCustomCategories(req, res) {
  try {
    const cats = await CustomCategory.findAll({ order: [['nome', 'ASC']] });
    return res.json(cats);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar categorias customizadas', details: String(err && err.message ? err.message : err) });
  }
}

export async function createCustomCategory(req, res) {
  try {
    const { nome, descricao, tipo } = req.body || {};
    if (!nome) return res.status(400).json({ error: 'nome é obrigatório' });
    const allowed = ['Novo', 'Adtivo', 'Renegociação'];
    const tipoValid = allowed.includes(String(tipo || 'Novo')) ? String(tipo || 'Novo') : 'Novo';
    const cat = await CustomCategory.create({ nome, descricao: descricao || null, tipo: tipoValid });
    return res.status(201).json(cat);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar categoria customizada', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateCustomCategory(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { nome, descricao, tipo } = req.body || {};
    const cat = await CustomCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'categoria customizada não encontrada' });
    if (nome) cat.nome = nome;
    if (descricao !== undefined) cat.descricao = descricao || null;
    if (tipo !== undefined) {
      const allowed = ['Novo', 'Adtivo', 'Renegociação'];
      if (!allowed.includes(String(tipo))) {
        return res.status(400).json({ error: 'tipo inválido' });
      }
      cat.tipo = String(tipo);
    }
    await cat.save();
    return res.json(cat);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar categoria customizada', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteCustomCategory(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const cat = await CustomCategory.findByPk(id);
    if (!cat) return res.status(404).json({ error: 'categoria customizada não encontrada' });
    await cat.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir categoria customizada', details: String(err && err.message ? err.message : err) });
  }
}

