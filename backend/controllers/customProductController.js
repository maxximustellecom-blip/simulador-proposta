import { CustomProduct, CustomCategory } from '../models/index.js';

export async function listCustomProducts(req, res) {
  try {
    const prods = await CustomProduct.findAll({
      include: [{ model: CustomCategory, as: 'category' }],
      order: [['created_at', 'DESC']]
    });
    return res.json(prods);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar produtos customizados', details: String(err && err.message ? err.message : err) });
  }
}

export async function createCustomProduct(req, res) {
  try {
    const { categoria_id, nome, descricao, preco } = req.body || {};
    const cid = Number(categoria_id || 0);
    if (!cid || !nome) return res.status(400).json({ error: 'categoria_id e nome são obrigatórios' });
    const cat = await CustomCategory.findByPk(cid);
    if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
    const prod = await CustomProduct.create({
      categoria_id: cid,
      nome,
      descricao: descricao || null,
      preco: Number(preco || 0)
    });
    const full = await CustomProduct.findByPk(prod.id, { include: [{ model: CustomCategory, as: 'category' }] });
    return res.status(201).json(full);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateCustomProduct(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const { categoria_id, nome, descricao, preco } = req.body || {};
    const prod = await CustomProduct.findByPk(id);
    if (!prod) return res.status(404).json({ error: 'produto não encontrado' });
    if (categoria_id) {
      const cid = Number(categoria_id || 0);
      const cat = await CustomCategory.findByPk(cid);
      if (!cat) return res.status(404).json({ error: 'categoria não encontrada' });
      prod.categoria_id = cid;
    }
    if (nome) prod.nome = nome;
    if (descricao !== undefined) prod.descricao = descricao || null;
    if (preco !== undefined) prod.preco = Number(preco || 0);
    await prod.save();
    const full = await CustomProduct.findByPk(prod.id, { include: [{ model: CustomCategory, as: 'category' }] });
    return res.json(full);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteCustomProduct(req, res) {
  try {
    const id = Number(req.params.id || 0);
    if (!id) return res.status(400).json({ error: 'id inválido' });
    const prod = await CustomProduct.findByPk(id);
    if (!prod) return res.status(404).json({ error: 'produto não encontrado' });
    await prod.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao excluir produto customizado', details: String(err && err.message ? err.message : err) });
  }
}

