
const cron = require("node-cron");

const env = require("../config/env");
const logger = require("../config/logger");
const dailyAgendaService = require("../domains/notification/dailyAgenda.service");

if (env.ENABLE_JOBS) {
  cron.schedule(env.DAILY_AGENDA_CRON, async () => {
    try {
      const hostCount = await dailyAgendaService.sendDailyAgendas();

      if (hostCount > 0) {
        logger.info({ hostCount }, "Sent daily agenda emails");
      }
    } catch (error) {
      logger.error({ err: error.message }, "Daily agenda job failed");
    }
  });

  logger.info({ cron: env.DAILY_AGENDA_CRON }, "Daily agenda job scheduled");
}

module.exports = {};
