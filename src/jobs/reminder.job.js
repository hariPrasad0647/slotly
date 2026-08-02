
const cron = require("node-cron");

const env = require("../config/env");
const logger = require("../config/logger");
const reminderService = require("../domains/notification/reminder.service");

if (env.ENABLE_JOBS) {
  cron.schedule(env.REMINDER_CRON, async () => {
    try {
      const count = await reminderService.processDueReminders();

      if (count > 0) {
        logger.info({ count }, "Processed due booking reminders");
      }
    } catch (error) {
      logger.error({ err: error.message }, "Reminder job failed");
    }
  });

  logger.info({ cron: env.REMINDER_CRON }, "Reminder job scheduled");
}

module.exports = {};
