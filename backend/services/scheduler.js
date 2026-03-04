import cron from 'node-cron';
import axios from 'axios';
import { Appointment, User } from '../models/index.js';
import { Op } from 'sequelize';

const ZAPI_URL = 'https://api.z-api.io/instances/3CE4B754983A50C28047EEE17BD0D626/token/292527328B6AC28FA057BFE5/send-text';
const ZAPI_TOKEN = 'Fa9be4d3c3cff47cb84b5d28e5ce3d58aS';

export const startScheduler = () => {
  // Executa a cada 1 minuto
  cron.schedule('* * * * *', async () => {
    console.log('[Scheduler] Verificando compromissos para amanhã...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const appointments = await Appointment.findAll({
        where: {
          date: tomorrowStr,
          notified: false
        },
        include: [{ model: User, as: 'user' }]
      });

      console.log(`[Scheduler] Encontrados ${appointments.length} compromissos para notificar.`);

      for (const appt of appointments) {
        const userName = appt.user ? appt.user.name : 'Usuário';
        // User requested to use the user's phone, not admin's
        let targetPhone = appt.user ? appt.user.celular : null;

        if (!targetPhone) {
            console.log(`[Scheduler] Usuário sem celular para compromisso ${appt.id}.`);
            continue;
        }

        // Basic cleaning
        targetPhone = targetPhone.replace(/\D/g, '');
        // Add DDI 55 if missing (assuming BR numbers 10-11 digits)
        if (targetPhone.length >= 10 && targetPhone.length <= 11) {
            targetPhone = '55' + targetPhone;
        }

        const message = `Olá ${userName}, lembrete de compromisso para amanhã (${tomorrowStr}) às ${appt.time}: ${appt.title}`;

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
          
          appt.notified = true;
          await appt.save();
          console.log(`[Scheduler] Notificação enviada para ${targetPhone} ref. compromisso ${appt.id}`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao enviar notificação para compromisso ${appt.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Erro no job de notificação:', error);
    }
  });
};
