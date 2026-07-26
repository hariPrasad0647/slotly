
const ApiError = require("../../utils/ApiError");

const assertRuleOwnership = (rule, hostProfileId) => {
  if (!rule || rule.hostProfileId !== hostProfileId) {
    throw new ApiError(404, "Availability rule not found");
  }
};

module.exports = {
  assertRuleOwnership,
};
