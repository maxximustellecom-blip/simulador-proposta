import cron from 'node-cron';
import axios from 'axios';
import { Appointment, User } from '../models/index.js';
import { Op } from 'sequelize';

const ZAPI_URL =
  process.env.ZAPI_URL ||
  'https://api.z-api.io/instances/3CE4B754983A50C28047EEE17BD0D626/token/292527328B6AC28FA057BFE5/send-text';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || 'Fa9be4d3c3cff47cb84b5d28e5ce3d58aS';
const SCHEDULER_TZ = process.env.SCHEDULER_TZ || 'America/Sao_Paulo';

export const startScheduler = () => {
  // Executa a cada 1 minuto
  cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Verificando compromissos para notificação...');
    try {
      const pad2 = (n) => String(n).padStart(2, '0');
      const toUtcMsFromDateStr = (dateStr) => {
        const [y, m, d] = String(dateStr || '').split('-').map((n) => Number(n));
        return Date.UTC(y || 1970, (m || 1) - 1, d || 1);
      };
      const toDateStrFromUtcMs = (ms) => {
        const dt = new Date(ms);
        return `${dt.getUTCFullYear()}-${pad2(dt.getUTCMonth() + 1)}-${pad2(dt.getUTCDate())}`;
      };
      const addDays = (dateStr, days) => toDateStrFromUtcMs(toUtcMsFromDateStr(dateStr) + (Number(days || 0) * 86400000));
      const diffDays = (fromStr, toStr) => Math.round((toUtcMsFromDateStr(toStr) - toUtcMsFromDateStr(fromStr)) / 86400000);
      const normalizeTimeHHMM = (timeStr) => {
        const m = String(timeStr || '').match(/(\d{1,2}):(\d{2})/);
        if (!m) return '';
        return `${pad2(m[1])}:${m[2]}`;
      };
      const getNowStrings = () => {
        const now = new Date();
        const dateStr = new Intl.DateTimeFormat('en-CA', { timeZone: SCHEDULER_TZ, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
        const hhmm = new Intl.DateTimeFormat('en-GB', { timeZone: SCHEDULER_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(now);
        const hhmmPrev = new Intl.DateTimeFormat('en-GB', { timeZone: SCHEDULER_TZ, hour: '2-digit', minute: '2-digit', hour12: false }).format(new Date(now.getTime() - 60000));
        return { todayStr: dateStr, nowHHMM: hhmm, prevHHMM: hhmmPrev };
      };

      const { todayStr, nowHHMM, prevHHMM } = getNowStrings();

      console.log(`[Scheduler] Verificando compromissos para ${todayStr} às ${nowHHMM} (antes de ${prevHHMM})`);

      const windowEnd = addDays(todayStr, 366);

      const whereBase = {
        date: { [Op.between]: [todayStr, windowEnd] },
        [Op.and]: [
          {
            [Op.or]: [
              { notified_day: false },
              { notified_before: false },
              { notified_day: { [Op.is]: null } },
              { notified_before: { [Op.is]: null } }
            ]
          }
        ]
      };

      let candidates;
      try {
        candidates = await Appointment.findAll({
          where: {
            ...whereBase,
            [Op.and]: [
              ...(Array.isArray(whereBase[Op.and]) ? whereBase[Op.and] : []),
              { [Op.or]: [{ finalizado: false }, { finalizado: { [Op.is]: null } }] }
            ]
          },
          include: [{ model: User, as: 'user' }]
        });
      } catch (e) {
        const code = e?.original?.code || e?.parent?.code || e?.code;
        const msg = String(e?.original?.sqlMessage || e?.message || '');
        const isMissingFinalizadoColumn = code === 'ER_BAD_FIELD_ERROR' && msg.toLowerCase().includes('finalizado');
        if (!isMissingFinalizadoColumn) throw e;

        candidates = await Appointment.findAll({
          where: whereBase,
          include: [{ model: User, as: 'user' }]
        });
      }

      const sendNotification = async ({ appt, daysOut, markDay, markBefore }) => {
        const userName = appt.user ? appt.user.name : 'Usuário';
        let targetPhone = appt.user ? appt.user.celular : null;

        if (!targetPhone) {
          console.log(`[Scheduler] Usuário sem celular para compromisso ${appt.id}.`);
          return;
        }

        targetPhone = targetPhone.replace(/\D/g, '');
        if (targetPhone.length >= 10 && targetPhone.length <= 11) {
          targetPhone = '55' + targetPhone;
        }

        const timeHHMM = normalizeTimeHHMM(appt.time);
        const dateLabel = String(appt.date || '');
        const whenLabel =
          daysOut === 0
            ? `hoje (${dateLabel})`
            : daysOut === 1
              ? `amanhã (${dateLabel})`
              : `daqui ${daysOut} dias (${dateLabel})`;
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

          if (markDay) appt.notified_day = true;
          if (markBefore) appt.notified_before = true;
          if (appt.notified_before && appt.notified_day) appt.notified = true;
          await appt.save();
          const kinds = [markBefore ? 'before' : null, markDay ? 'day' : null].filter(Boolean).join('+');
          console.log(`[Scheduler] Notificação (${kinds}) enviada para ${targetPhone} ref. compromisso ${appt.id}`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao enviar notificação para compromisso ${appt.id}:`, err.message);
        }
      };

      for (const appt of candidates) {
        const timeHHMM = normalizeTimeHHMM(appt.time);
        if (!timeHHMM) continue;
        if (timeHHMM !== nowHHMM && timeHHMM !== prevHHMM) continue;

        const apptDate = String(appt.date || '');
        const daysOut = diffDays(todayStr, apptDate);
        const markDay = apptDate === todayStr && !appt.notified_day;

        const dias = Math.max(0, parseInt(appt.dias_antecedencia ?? 1, 10) || 0);
        const canNotifyBefore = dias > 0 && !appt.notified_before;
        const triggerDate = canNotifyBefore ? addDays(apptDate, -dias) : null;

        const markBefore =
          canNotifyBefore &&
          ((triggerDate === todayStr && apptDate !== todayStr) || (apptDate === todayStr && triggerDate <= todayStr));

        if (!markDay && !markBefore) continue;

        await sendNotification({ appt, daysOut: Math.max(0, daysOut), markDay, markBefore });
      }
    } catch (error) {
      console.log(error);
      console.error('[Scheduler] Erro no job de notificação:', error);
    }
  }, { timezone: SCHEDULER_TZ });
};
