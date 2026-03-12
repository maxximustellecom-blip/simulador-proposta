import cron from 'node-cron';
import axios from 'axios';
import { Appointment, User } from '../models/index.js';
import { Op } from 'sequelize';

const ZAPI_URL = 'https://api.z-api.io/instances/3CE4B754983A50C28047EEE17BD0D626/token/292527328B6AC28FA057BFE5/send-text';
const ZAPI_TOKEN = 'Fa9be4d3c3cff47cb84b5d28e5ce3d58aS';

export const startScheduler = () => {
  // Executa a cada 1 minuto
  cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Verificando compromissos para notificação...');
    try {
      const pad2 = (n) => String(n).padStart(2, '0');
      const toDateStrLocal = (d) => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      const addDays = (dateStr, days) => {
        const [y, m, dd] = String(dateStr).split('-').map(n => Number(n));
        const dt = new Date(y, (m || 1) - 1, dd || 1);
        dt.setDate(dt.getDate() + Number(days || 0));
        return toDateStrLocal(dt);
      };
      const diffDays = (fromStr, toStr) => {
        const [y1, m1, d1] = String(fromStr).split('-').map(n => Number(n));
        const [y2, m2, d2] = String(toStr).split('-').map(n => Number(n));
        const a = new Date(y1, (m1 || 1) - 1, d1 || 1);
        const b = new Date(y2, (m2 || 1) - 1, d2 || 1);
        const ms = b.getTime() - a.getTime();
        return Math.round(ms / 86400000);
      };

      const now = new Date();
      const todayStr = toDateStrLocal(now);
      const nowHHMM = `${pad2(now.getHours())}:${pad2(now.getMinutes())}`;

      const dueToday = await Appointment.findAll({
        where: {
          date: todayStr,
          notified_day: false
        },
        include: [{ model: User, as: 'user' }]
      });

      const beforeWindowEnd = addDays(todayStr, 60);
      const dueBefore = await Appointment.findAll({
        where: {
          date: { [Op.between]: [todayStr, beforeWindowEnd] },
          notified_before: false,
          dias_antecedencia: { [Op.gt]: 0 }
        },
        include: [{ model: User, as: 'user' }]
      });

      const sendNotification = async ({ appt, kind, daysOut }) => {
        const userName = appt.user ? appt.user.name : 'Usuário';
        // User requested to use the user's phone, not admin's
        let targetPhone = appt.user ? appt.user.celular : null;

        if (!targetPhone) {
            console.log(`[Scheduler] Usuário sem celular para compromisso ${appt.id}.`);
            return;
        }

        // Basic cleaning
        targetPhone = targetPhone.replace(/\D/g, '');
        // Add DDI 55 if missing (assuming BR numbers 10-11 digits)
        if (targetPhone.length >= 10 && targetPhone.length <= 11) {
            targetPhone = '55' + targetPhone;
        }

        const timeHHMM = String(appt.time || '').slice(0, 5);
        const dateLabel = String(appt.date || '');
        const whenLabel = kind === 'day'
          ? `hoje (${dateLabel})`
          : (daysOut === 1 ? `amanhã (${dateLabel})` : `daqui ${daysOut} dias (${dateLabel})`);
        const message = `Olá ${userName}, lembrete de compromisso para ${whenLabel} às ${timeHHMM}: ${appt.title}`;

        try {
          await axios.post(ZAPI_URL, {
            phone: targetPhone,
            message: message
          }, {
            headers: {
              'Client-Token': ZAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          });

          if (kind === 'day') appt.notified_day = true;
          if (kind === 'before') appt.notified_before = true;
          if (appt.notified_before && appt.notified_day) appt.notified = true;
          await appt.save();
          console.log(`[Scheduler] Notificação (${kind}) enviada para ${targetPhone} ref. compromisso ${appt.id}`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao enviar notificação para compromisso ${appt.id}:`, err.message);
        }
      };

      for (const appt of dueToday) {
        const timeHHMM = String(appt.time || '').slice(0, 5);
        if (timeHHMM !== nowHHMM) continue;
        await sendNotification({ appt, kind: 'day', daysOut: 0 });
      }

      for (const appt of dueBefore) {
        const timeHHMM = String(appt.time || '').slice(0, 5);
        if (timeHHMM !== nowHHMM) continue;
        const daysOut = diffDays(todayStr, String(appt.date || ''));
        const dias = Math.max(0, parseInt(appt.dias_antecedencia ?? 1, 10) || 0);
        if (daysOut !== dias) continue;
        await sendNotification({ appt, kind: 'before', daysOut });
      }
    } catch (error) {
      console.log(error);
      console.error('[Scheduler] Erro no job de notificação:', error);
    }
  });
};
