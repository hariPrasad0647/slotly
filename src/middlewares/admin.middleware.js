
const ApiError = require("../utils/ApiError");

const requireRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return next(new ApiError(403, "You do not have permission to perform this action"));
    }

    return next();
  };
};

const adminMiddleware = requireRole("ADMIN", "SUPER_ADMIN");

module.exports = {
  adminMiddleware,
  requireRole,
};
