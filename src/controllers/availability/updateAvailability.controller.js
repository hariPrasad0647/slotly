
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const availabilityService = require("../../domains/availability/availability.service");

const updateAvailabilityController = asyncHandler(async (req, res) => {
  const rule = await availabilityService.updateRule(
    req.user.id,
    req.params.ruleId,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Availability rule updated successfully", rule));
});

module.exports = {
  updateAvailabilityController,
};
