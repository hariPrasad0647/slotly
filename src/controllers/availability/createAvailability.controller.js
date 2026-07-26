
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const availabilityService = require("../../domains/availability/availability.service");

const createAvailabilityController = asyncHandler(async (req, res) => {
  const rule = await availabilityService.createRule(req.user.id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Availability rule created successfully", rule));
});

module.exports = {
  createAvailabilityController,
};
