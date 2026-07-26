
const ApiError = require("../../utils/ApiError");

const assertUserIsActive = (user) => {
  if (!user.isActive || user.deletedAt) {
    throw new ApiError(403, "This account has been deactivated");
  }
};

module.exports = {
  assertUserIsActive,
};
