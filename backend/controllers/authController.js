import bcrypt from 'bcryptjs';
import { User, Sale, Simulation, AccessProfile } from '../models/index.js';
import { Op } from 'sequelize';

export async function register(req, res) {
  try {
    const { 
      name, email, password, role, matricula, celular, profile_id, tipo, comissao,
      comissao_novo, comissao_aditivo, comissao_renovacao, comissao_migracao,
      comissao_pf_pj, comissao_tt, comissao_ultra_fibra, comissao_controle_pf,
      comissao_wttx, comissao_m2m, comissao_fixa_ativa
    } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'missing' });
    const validRole = role === 'admin' ? 'admin' : 'user';
    const exists = await User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ error: 'exists' });
    if (matricula) {
      const existsMat = await User.findOne({ where: { matricula } });
      if (existsMat) return res.status(409).json({ error: 'matricula_exists' });
    }
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ 
      name, 
      email, 
      password: hash, 
      role: validRole, 
      matricula, 
      celular, 
      profile_id: profile_id || null,
      tipo: tipo || 'interno',
      comissao: comissao !== undefined ? Number(comissao) : 0,
      comissao_novo: comissao_novo !== undefined ? Number(comissao_novo) : 0,
      comissao_aditivo: comissao_aditivo !== undefined ? Number(comissao_aditivo) : 0,
      comissao_renovacao: comissao_renovacao !== undefined ? Number(comissao_renovacao) : 0,
      comissao_migracao: comissao_migracao !== undefined ? Number(comissao_migracao) : 0,
      comissao_pf_pj: comissao_pf_pj !== undefined ? Number(comissao_pf_pj) : 0,
      comissao_tt: comissao_tt !== undefined ? Number(comissao_tt) : 0,
      comissao_ultra_fibra: comissao_ultra_fibra !== undefined ? Number(comissao_ultra_fibra) : 0,
      comissao_controle_pf: comissao_controle_pf !== undefined ? Number(comissao_controle_pf) : 0,
      comissao_wttx: comissao_wttx !== undefined ? Number(comissao_wttx) : 0,
      comissao_m2m: comissao_m2m !== undefined ? Number(comissao_m2m) : 0,
      comissao_fixa_ativa: comissao_fixa_ativa === true || comissao_fixa_ativa === 'true'
    });
    return res.status(201).json({ 
      id: user.id, 
      name: user.name, 
      email: user.email, 
      role: user.role, 
      matricula: user.matricula, 
      celular: user.celular, 
      profile_id: user.profile_id,
      tipo: user.tipo,
      comissao: Number(user.comissao || 0),
      comissao_novo: Number(user.comissao_novo || 0),
      comissao_aditivo: Number(user.comissao_aditivo || 0),
      comissao_renovacao: Number(user.comissao_renovacao || 0),
      comissao_migracao: Number(user.comissao_migracao || 0),
      comissao_pf_pj: Number(user.comissao_pf_pj || 0),
      comissao_tt: Number(user.comissao_tt || 0),
      comissao_ultra_fibra: Number(user.comissao_ultra_fibra || 0),
      comissao_controle_pf: Number(user.comissao_controle_pf || 0),
       comissao_wttx: Number(user.comissao_wttx || 0),
       comissao_m2m: Number(user.comissao_m2m || 0),
       comissao_fixa_ativa: Boolean(user.comissao_fixa_ativa)
     });
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
      celular: u.celular,
      tipo: u.tipo || 'interno',
      comissao: Number(u.comissao || 0),
      comissao_novo: Number(u.comissao_novo || 0),
      comissao_aditivo: Number(u.comissao_aditivo || 0),
      comissao_renovacao: Number(u.comissao_renovacao || 0),
      comissao_migracao: Number(u.comissao_migracao || 0),
      comissao_pf_pj: Number(u.comissao_pf_pj || 0),
      comissao_tt: Number(u.comissao_tt || 0),
      comissao_ultra_fibra: Number(u.comissao_ultra_fibra || 0),
      comissao_controle_pf: Number(u.comissao_controle_pf || 0),
      comissao_wttx: Number(u.comissao_wttx || 0),
      comissao_m2m: Number(u.comissao_m2m || 0),
      comissao_fixa_ativa: Boolean(u.comissao_fixa_ativa),
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
    const { 
      name, email, role, password, matricula, celular, profile_id, tipo, comissao,
      comissao_novo, comissao_aditivo, comissao_renovacao, comissao_migracao,
      comissao_pf_pj, comissao_tt, comissao_ultra_fibra, comissao_controle_pf,
       comissao_wttx, comissao_m2m, comissao_fixa_ativa
     } = req.body || {};
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
    if (celular !== undefined) user.celular = celular;
    if (role) user.role = role === 'admin' ? 'admin' : 'user';
    if (profile_id !== undefined) user.profile_id = profile_id || null;
    if (tipo) user.tipo = tipo;
    if (comissao !== undefined) user.comissao = Number(comissao);
    if (comissao_novo !== undefined) user.comissao_novo = Number(comissao_novo);
    if (comissao_aditivo !== undefined) user.comissao_aditivo = Number(comissao_aditivo);
    if (comissao_renovacao !== undefined) user.comissao_renovacao = Number(comissao_renovacao);
    if (comissao_migracao !== undefined) user.comissao_migracao = Number(comissao_migracao);
    if (comissao_pf_pj !== undefined) user.comissao_pf_pj = Number(comissao_pf_pj);
    if (comissao_tt !== undefined) user.comissao_tt = Number(comissao_tt);
    if (comissao_ultra_fibra !== undefined) user.comissao_ultra_fibra = Number(comissao_ultra_fibra);
    if (comissao_controle_pf !== undefined) user.comissao_controle_pf = Number(comissao_controle_pf);
    if (comissao_wttx !== undefined) user.comissao_wttx = Number(comissao_wttx);
    if (comissao_m2m !== undefined) user.comissao_m2m = Number(comissao_m2m);
    if (comissao_fixa_ativa !== undefined) user.comissao_fixa_ativa = (comissao_fixa_ativa === true || comissao_fixa_ativa === 'true');
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
      celular: updatedUser.celular,
      tipo: updatedUser.tipo,
      comissao: Number(updatedUser.comissao || 0),
      comissao_novo: Number(updatedUser.comissao_novo || 0),
      comissao_aditivo: Number(updatedUser.comissao_aditivo || 0),
      comissao_renovacao: Number(updatedUser.comissao_renovacao || 0),
      comissao_migracao: Number(updatedUser.comissao_migracao || 0),
      comissao_pf_pj: Number(updatedUser.comissao_pf_pj || 0),
      comissao_tt: Number(updatedUser.comissao_tt || 0),
      comissao_ultra_fibra: Number(updatedUser.comissao_ultra_fibra || 0),
      comissao_controle_pf: Number(updatedUser.comissao_controle_pf || 0),
       comissao_wttx: Number(updatedUser.comissao_wttx || 0),
       comissao_m2m: Number(updatedUser.comissao_m2m || 0),
       comissao_fixa_ativa: Boolean(updatedUser.comissao_fixa_ativa),
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
