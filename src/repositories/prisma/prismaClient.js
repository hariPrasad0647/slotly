const { PrismaClient } = require("@prisma/client");

const logger = require("../../config/logger");

const globalForPrisma = global;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "warn", "error"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

/*
|--------------------------------------------------------------------------
| Prisma Connection Events
|--------------------------------------------------------------------------
*/

prisma.$on("error", (event) => {
  logger.error(
    {
      target: event.target,
      message: event.message,
    },
    "Prisma error"
  );
});

prisma.$on("warn", (event) => {
  logger.warn(
    {
      target: event.target,
      message: event.message,
    },
    "Prisma warning"
  );
});

/*
|--------------------------------------------------------------------------
| Graceful Shutdown
|--------------------------------------------------------------------------
*/

const shutdown = async () => {
  try {
    await prisma.$disconnect();

    logger.info("Prisma disconnected successfully");
  } catch (error) {
    logger.error(
      {
        err: error,
      },
      "Failed to disconnect Prisma"
    );
  }
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

module.exports = prisma;