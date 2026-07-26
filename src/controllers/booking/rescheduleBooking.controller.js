
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const rescheduleBookingController = asyncHandler(async (req, res) => {
  const booking = await bookingService.rescheduleBooking(
    req.user.id,
    req.params.bookingId,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking rescheduled successfully", booking));
});

module.exports = {
  rescheduleBookingController,
};
