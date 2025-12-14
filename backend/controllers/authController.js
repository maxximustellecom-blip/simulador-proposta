import bcrypt from 'bcryptjs';
import { User, Sale, Simulation } from '../models/index.js';
import { Op } from 'sequelize';

export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'missing' });
    const validRole = role === 'admin' ? 'admin' : 'user';
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'exists' });
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: validRole });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing' });
    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function listUsers(req, res) {
  try {
    const { role } = req.query || {};
    const where = {};
    if (role) where.role = role;
    const users = await User.findAll({ where, order: [['name', 'ASC']] });
    return res.json(users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role })));
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function updateUser(req, res) {
  try {
    const actor = req.user;
    if (!actor || actor.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    const { name, email, role, password } = req.body || {};
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ error: 'email_exists' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (role) user.role = role === 'admin' ? 'admin' : 'user';
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }
    await user.save();
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function deleteUser(req, res) {
  try {
    const actor = req.user;
    if (!actor || actor.role !== 'admin') return res.status(403).json({ error: 'forbidden' });
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ error: 'not_found' });
    const userName = user.name;
    await Sale.destroy({ where: { created_by: id } });
    await Sale.destroy({ where: { vendedor: userName } });
    await Simulation.destroy({ where: { created_by: id } });
    await user.destroy();
    return res.json({ ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}
