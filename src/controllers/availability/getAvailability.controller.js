
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const availabilityService = require("../../domains/availability/availability.service");
const bookingService = require("../../domains/booking/booking.service");

const getAvailabilityController = asyncHandler(async (req, res) => {
  const { from, to, isBooked, includeSlots } = req.query;

  const rules = await availabilityService.listRules(req.user.id);

  let slots = [];

  if (includeSlots === "true") {
    slots = await bookingService.listSlotsForHost(req.user.id, {
      from,
      to,
      isBooked,
    });
  }

  return res
    .status(200)
    .json(new ApiResponse(200, "Availability fetched successfully", { rules, slots }));
});

module.exports = {
  getAvailabilityController,
};
