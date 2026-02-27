import cron from 'node-cron';
import axios from 'axios';
import { Appointment, User } from '../models/index.js';
import { Op } from 'sequelize';

const ZAPI_URL = 'https://api.z-api.io/instances/3CE4B754983A50C28047EEE17BD0D626/token/292527328B6AC28FA057BFE5/send-text';
const ZAPI_TOKEN = 'Fa9be4d3c3cff47cb84b5d28e5ce3d58aS';
const ADMIN_PHONE = '5561981644455';

export const startScheduler = () => {
  // Executa todo dia às 08:00
  cron.schedule('0 8 * * *', async () => {
    console.log('[Scheduler] Verificando compromissos para amanhã...');
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const dateStr = tomorrow.toISOString().split('T')[0];

      const appointments = await Appointment.findAll({
        where: {
          date: dateStr,
          notified: false
        },
        include: [{ model: User, as: 'user' }]
      });

      console.log(`[Scheduler] Encontrados ${appointments.length} compromissos para notificar.`);

      for (const appt of appointments) {
        const userName = appt.user ? appt.user.name : 'Usuário';
        const message = `Olá ${userName}, lembrete de compromisso para amanhã (${dateStr}) às ${appt.time}: ${appt.title}`;

        try {
          await axios.post(ZAPI_URL, {
            phone: ADMIN_PHONE,
            message: message
          }, {
            headers: {
              'Client-Token': ZAPI_TOKEN,
              'Content-Type': 'application/json'
            }
          });
          
          appt.notified = true;
          await appt.save();
          console.log(`[Scheduler] Notificação enviada para ${ADMIN_PHONE} ref. compromisso ${appt.id}`);
        } catch (err) {
          console.error(`[Scheduler] Erro ao enviar notificação para compromisso ${appt.id}:`, err.message);
        }
      }
    } catch (error) {
      console.error('[Scheduler] Erro no job de notificação:', error);
    }
  });
};
