import cron from 'node-cron';
import axios from 'axios';
import { Appointment, User } from '../models/index.js';
import { Op } from 'sequelize';
import moment from 'moment-timezone';

const ZAPI_URL =
  process.env.ZAPI_URL ||
  'https://api.z-api.io/instances/3CE4B754983A50C28047EEE17BD0D626/token/292527328B6AC28FA057BFE5/send-text';
const ZAPI_TOKEN = process.env.ZAPI_TOKEN || 'Fa9be4d3c3cff47cb84b5d28e5ce3d58aS';
const SCHEDULER_TZ = process.env.SCHEDULER_TZ || 'America/Sao_Paulo';

export const startScheduler = () => {

  cron.schedule("* * * * *", async () => {

    console.log("[Scheduler] Verificando compromissos...");

    try {

      const now = moment.tz(SCHEDULER_TZ).seconds(0).milliseconds(0);
      const todayStr = now.format("YYYY-MM-DD");

      const isDueWithinMinutes = (targetMoment, windowMinutes = 2) => {
        if (!targetMoment?.isValid?.()) return false;
        const diffMinutes = now.diff(targetMoment, "minutes");
        return diffMinutes >= 0 && diffMinutes < windowMinutes;
      };

      const appointments = await Appointment.findAll({
        where: {
          date: {
            [Op.gte]: todayStr
          }
        },
        include: [{ model: User, as: "user" }]
      });

      for (const appt of appointments) {

        const apptDateTime = moment.tz(
          `${appt.date} ${appt.time}`,
          ["YYYY-MM-DD HH:mm:ss", "YYYY-MM-DD HH:mm"],
          SCHEDULER_TZ
        );

        if (!apptDateTime.isValid()) {
          console.warn("[Scheduler] Compromisso com data/hora inválida:", appt?.id, appt?.date, appt?.time);
          continue;
        }

        const diasAntecedencia = Math.max(0, Number(appt.dias_antecedencia ?? 1) || 0);
        const remindBeforeAt = apptDateTime.clone().subtract(diasAntecedencia, "days");

        let message = "";
        let shouldSend = false;

        if (!appt.notified_day && isDueWithinMinutes(apptDateTime)) {

          message = `Olá ${appt.user.name}, seu compromisso é HOJE às ${appt.time}: ${appt.title}`;
          shouldSend = true;
          appt.notified_day = true;

        }

        if (!shouldSend && !appt.notified_before && diasAntecedencia > 0 && isDueWithinMinutes(remindBeforeAt) && now.isBefore(apptDateTime)) {

          message = `Olá ${appt.user.name}, lembrete: seu compromisso será em ${diasAntecedencia} dia(s) às ${appt.time}: ${appt.title}`;
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
