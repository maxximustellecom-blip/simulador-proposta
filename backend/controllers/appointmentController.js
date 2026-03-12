import { Appointment } from '../models/index.js';
import { Op } from 'sequelize';

export const list = async (req, res) => {
  try {
    const { from, to } = req.query;
    const userId = req.user ? req.user.id : null;
    
    const where = {};
    if (userId) where.user_id = userId;
    if (from && to) {
      where.date = { [Op.between]: [from, to] };
    }

    const data = await Appointment.findAll({ 
      where, 
      order: [['date', 'ASC'], ['time', 'ASC']] 
    });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });

    const { title, description, date, time, dias_antecedencia, finalizado } = req.body;
    if (!title || !date || !time) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const dias = Math.max(0, parseInt(dias_antecedencia ?? 1, 10) || 0);
    const item = await Appointment.create({ 
      title, 
      description, 
      date, 
      time, 
      user_id: userId,
      dias_antecedencia: dias,
      finalizado: Boolean(finalizado),
      notified_before: false,
      notified_day: false,
      notified: false
    });
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const { title, description, date, time, dias_antecedencia, finalizado } = req.body;

    const existing = await Appointment.findOne({ where: { id, user_id: userId } });
    if (!existing) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }

    const dias = Math.max(0, parseInt(dias_antecedencia ?? existing.dias_antecedencia ?? 1, 10) || 0);
    const shouldResetNotify =
      (date && String(date) !== String(existing.date)) ||
      (time && String(time) !== String(existing.time)) ||
      (dias !== Number(existing.dias_antecedencia || 1));

    const [updated] = await Appointment.update(
      {
        title,
        description,
        date,
        time,
        dias_antecedencia: dias,
        ...(typeof finalizado === 'undefined' ? {} : { finalizado: Boolean(finalizado) }),
        ...(shouldResetNotify
          ? { notified_before: false, notified_day: false, notified: false }
          : {})
      },
      { where: { id, user_id: userId } }
    );

    if (!updated) {
      return res.status(404).json({ error: 'Not found or unauthorized' });
    }

    const item = await Appointment.findByPk(id);
    res.json(item);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    
    const destroyed = await Appointment.destroy({ where: { id, user_id: userId } });
    if (!destroyed) return res.status(404).json({ error: 'Not found or unauthorized' });
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
