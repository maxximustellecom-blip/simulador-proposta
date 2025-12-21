import bcrypt from 'bcryptjs';
import { User, Sale, Simulation, AccessProfile } from '../models/index.js';
import { Op } from 'sequelize';

export async function register(req, res) {
  try {
    const { name, email, password, role, matricula, profile_id } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'missing' });
    const validRole = role === 'admin' ? 'admin' : 'user';
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'exists' });
    if (matricula) {
      const existsMat = await User.findOne({ where: { matricula } });
      if (existsMat) return res.status(409).json({ error: 'matricula_exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: validRole, matricula, profile_id: profile_id || null });
    return res.status(201).json({ id: user.id, name: user.name, email: user.email, role: user.role, matricula: user.matricula, profile_id: user.profile_id });
  } catch (e) {
    return res.status(500).json({ error: e });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'missing' });
    const user = await User.findOne({ where: { [Op.or]: [{ email }, { matricula: email }] } });
    if (!user) return res.status(401).json({ error: 'invalid' });
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) return res.status(401).json({ error: 'invalid' });
    return res.json({ id: user.id, name: user.name, email: user.email, role: user.role, matricula: user.matricula });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
}

export async function listUsers(req, res) {
  try {
    const { role } = req.query || {};
    const where = {};
    if (role) where.role = role;
    const users = await User.findAll({ 
      where, 
      include: [{ model: AccessProfile, as: 'profile' }],
      order: [['name', 'ASC']] 
    });
    return res.json(users.map(u => ({ 
      id: u.id, 
      name: u.name, 
      email: u.email, 
      role: u.role, 
      matricula: u.matricula,
      profile: u.profile ? { id: u.profile.id, name: u.profile.name } : null
    })));
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
    const { name, email, role, password, matricula, profile_id } = req.body || {};
    if (email && email !== user.email) {
      const exists = await User.findOne({ where: { email } });
      if (exists) return res.status(409).json({ error: 'email_exists' });
    }
    if (matricula && matricula !== user.matricula) {
      const existsMat = await User.findOne({ where: { matricula } });
      if (existsMat) return res.status(409).json({ error: 'matricula_exists' });
    }
    if (name) user.name = name;
    if (email) user.email = email;
    if (matricula !== undefined) user.matricula = matricula;
    if (role) user.role = role === 'admin' ? 'admin' : 'user';
    if (profile_id !== undefined) user.profile_id = profile_id || null;
    if (password) {
      const hash = await bcrypt.hash(password, 10);
      user.password = hash;
    }
    await user.save();
    const updatedUser = await User.findByPk(user.id, { include: [{ model: AccessProfile, as: 'profile' }] });
    return res.json({ 
      id: updatedUser.id, 
      name: updatedUser.name, 
      email: updatedUser.email, 
      role: updatedUser.role, 
      matricula: updatedUser.matricula,
      profile: updatedUser.profile ? { id: updatedUser.profile.id, name: updatedUser.profile.name } : null
    });
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
    if (id === 1) return res.status(403).json({ error: 'protected_admin' });
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
