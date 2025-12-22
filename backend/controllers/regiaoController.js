import { Regiao } from '../models/index.js';

export const getAll = async (req, res) => {
  try {
    const regioes = await Regiao.findAll();
    res.json(regioes);
  } catch (error) {
    console.error('Error fetching regioes:', error);
    res.status(500).json({ error: 'Error fetching regioes' });
  }
};

export const create = async (req, res) => {
  try {
    const { nome, items } = req.body;
    const regiao = await Regiao.create({ nome, items });
    res.status(201).json(regiao);
  } catch (error) {
    console.error('Error creating regiao:', error);
    res.status(500).json({ error: 'Error creating regiao' });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { nome, items } = req.body;
    const regiao = await Regiao.findByPk(id);
    
    if (!regiao) {
      return res.status(404).json({ error: 'Regiao not found' });
    }

    await regiao.update({ nome, items });
    res.json(regiao);
  } catch (error) {
    console.error('Error updating regiao:', error);
    res.status(500).json({ error: 'Error updating regiao' });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const regiao = await Regiao.findByPk(id);
    
    if (!regiao) {
      return res.status(404).json({ error: 'Regiao not found' });
    }

    await regiao.destroy();
    res.json({ message: 'Regiao deleted successfully' });
  } catch (error) {
    console.error('Error deleting regiao:', error);
    res.status(500).json({ error: 'Error deleting regiao' });
  }
};
