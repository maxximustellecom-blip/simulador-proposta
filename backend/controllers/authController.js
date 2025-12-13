import bcrypt from 'bcryptjs';
import { User } from '../models/index.js';

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
