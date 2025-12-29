import { AccessProfile } from '../models/index.js';

export async function listProfiles(req, res) {
  try {
    const profiles = await AccessProfile.findAll({ order: [['name', 'ASC']] });
    return res.json(profiles);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao listar perfis', details: String(err && err.message ? err.message : err) });
  }
}

export async function getProfile(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const profile = await AccessProfile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'perfil não encontrado' });
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao obter perfil', details: String(err && err.message ? err.message : err) });
  }
}

export async function createProfile(req, res) {
  try {
    const { name, description, commission_config } = req.body || {};
    if (!name) return res.status(400).json({ error: 'nome obrigatório' });
    
    const exists = await AccessProfile.findOne({ where: { name } });
    if (exists) return res.status(409).json({ error: 'perfil já existe' });

    const profile = await AccessProfile.create({ name, description, commission_config });
    return res.status(201).json(profile);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao criar perfil', details: String(err && err.message ? err.message : err) });
  }
}

export async function updateProfile(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const { name, description, commission_config } = req.body || {};
    
    const profile = await AccessProfile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'perfil não encontrado' });

    if (name && name !== profile.name) {
      const exists = await AccessProfile.findOne({ where: { name } });
      if (exists) return res.status(409).json({ error: 'nome de perfil já existe' });
      profile.name = name;
    }
    if (description !== undefined) profile.description = description;
    if (commission_config !== undefined) profile.commission_config = commission_config;

    await profile.save();
    return res.json(profile);
  } catch (err) {
    return res.status(500).json({ error: 'erro ao atualizar perfil', details: String(err && err.message ? err.message : err) });
  }
}

export async function deleteProfile(req, res) {
  try {
    const id = Number(req.params.id);
    if (!id) return res.status(400).json({ error: 'missing_id' });
    const profile = await AccessProfile.findByPk(id);
    if (!profile) return res.status(404).json({ error: 'perfil não encontrado' });
    await profile.destroy();
    return res.json({ ok: true });
  } catch (err) {
    return res.status(500).json({ error: 'erro ao remover perfil', details: String(err && err.message ? err.message : err) });
  }
}
