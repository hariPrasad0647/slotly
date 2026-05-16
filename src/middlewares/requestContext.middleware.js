
const { v4: uuidv4 } = require("uuid");

const requestContextMiddleware = (req, res, next) => {
  req.requestId = uuidv4();

  res.setHeader("x-request-id", req.requestId);

  next();
};

module.exports = requestContextMiddleware;
