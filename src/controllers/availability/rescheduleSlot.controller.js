
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const rescheduleSlotController = asyncHandler(async (req, res) => {
  const result = await bookingService.rescheduleSlot(
    req.user.id,
    req.params.slotId,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Slot rescheduled successfully", result));
});

module.exports = {
  rescheduleSlotController,
};
