
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const cancelBookingController = asyncHandler(async (req, res) => {
  const booking = await bookingService.cancelBooking(
    req.user,
    req.params.bookingId,
    req.body
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking cancelled successfully", booking));
});

module.exports = {
  cancelBookingController,
};
