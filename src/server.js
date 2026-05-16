
const http = require("http");

const app = require("./app");
const env = require("./config/env");
const logger = require("./config/logger");
const prisma = require("./repositories/prisma/prismaClient");
const bootstrap = require("./bootstrap");

const server = http.createServer(app);

const startServer = async () => {
  try {
    /*
    |--------------------------------------------------------------------------
    | Connect Database
    |--------------------------------------------------------------------------
    */

    await prisma.$connect();

    logger.info("✅ Prisma connected successfully");

    /*
    |--------------------------------------------------------------------------
    | Bootstrap Application
    |--------------------------------------------------------------------------
    */

    await bootstrap();

    /*
    |--------------------------------------------------------------------------
    | Start HTTP Server
    |--------------------------------------------------------------------------
    */

    server.listen(env.PORT, () => {
      logger.info(
        `🚀 Slotly backend running on port ${env.PORT}`
      );
    });
  } catch (error) {
    logger.error(error, "❌ Failed to start server");
    process.exit(1);
  }
};

startServer();

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const shutdown = async (signal) => {
  logger.warn(`⚠️ Received ${signal}. Shutting down gracefully...`);

  try {
    await prisma.$disconnect();

    server.close(() => {
      logger.info("✅ Server closed successfully");
      process.exit(0);
    });
  } catch (error) {
    logger.error(error, "❌ Error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

