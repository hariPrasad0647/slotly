
const logger = require("./config/logger");

const bootstrap = async () => {
  try {
    logger.info("🚀 Bootstrapping Slotly backend...");

    /*
    |--------------------------------------------------------------------------
    | Register Event Listeners
    |--------------------------------------------------------------------------
    */

    require("./events/eventBus");

    /*
    |--------------------------------------------------------------------------
    | Initialize Cron Jobs
    |--------------------------------------------------------------------------
    */

    require("./jobs/reminder.job");
    require("./jobs/dailyAgenda.job");
    // require("./jobs/subscriptionExpiry.job");

    logger.info("✅ Bootstrap completed");
  } catch (error) {
    logger.error(error, "❌ Bootstrap failed");
    process.exit(1);
  }
};

module.exports = bootstrap;

