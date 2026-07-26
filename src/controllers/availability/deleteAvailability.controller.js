
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const availabilityService = require("../../domains/availability/availability.service");
const bookingService = require("../../domains/booking/booking.service");

const deleteAvailabilityController = asyncHandler(async (req, res) => {
  await availabilityService.deleteRule(req.user.id, req.params.ruleId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Availability rule deleted successfully"));
});

const deleteSlotController = asyncHandler(async (req, res) => {
  await bookingService.deleteSlot(req.user.id, req.params.slotId);

  return res.status(200).json(new ApiResponse(200, "Slot deleted successfully"));
});

module.exports = {
  deleteAvailabilityController,
  deleteSlotController,
};
