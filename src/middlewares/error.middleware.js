
const env = require("../config/env");
const logger = require("../config/logger");

const errorMiddleware = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;

  logger.error(
    {
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      statusCode,
      stack: err.stack,
    },
    err.message
  );

  return res.status(statusCode).json({
    success: false,
    statusCode,
    message:
      env.NODE_ENV === "production"
        ? "Internal Server Error"
        : err.message,
    errors: err.errors || [],
    requestId: req.requestId,
  });
};

module.exports = errorMiddleware;

