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

  cron.schedule("* * * * *", async () => {

    console.log("[Scheduler] Verificando compromissos...");

    try {

      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];

      const appointments = await Appointment.findAll({
        where: {
          date: {
            [Op.gte]: todayStr
          }
        },
        include: [{ model: User, as: "user" }]
      });

      for (const appt of appointments) {

        const apptDate = new Date(appt.date);
        const diffTime = apptDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let message = "";
        let shouldSend = false;

        if (diffDays === 0 && !appt.notified_day) {

          message = `Olá ${appt.user.name}, seu compromisso é HOJE às ${appt.time}: ${appt.title}`;
          shouldSend = true;
          appt.notified_day = true;

        }

        if (diffDays > 0 && !appt.notified_before) {

          message = `Olá ${appt.user.name}, lembrete: seu compromisso será em ${diffDays} dia(s) às ${appt.time}: ${appt.title}`;
          shouldSend = true;
          appt.notified_before = true;

        }

        if (!shouldSend) continue;

        let phone = appt.user.celular.replace(/\D/g, "");

        if (phone.length <= 11) {
          phone = "55" + phone;
        }

        await axios.post(ZAPI_URL, {
          phone,
          message
        }, {
          headers: {
            "Client-Token": ZAPI_TOKEN
          }
        });

        appt.notified = true;
        await appt.save();

        console.log(`[Scheduler] Notificação enviada para ${phone}`);

      }

    } catch (error) {

      console.error("[Scheduler] erro:", error);

    }

  }, { timezone: SCHEDULER_TZ });

};
