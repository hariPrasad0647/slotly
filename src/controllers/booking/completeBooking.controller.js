
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const completeBookingController = asyncHandler(async (req, res) => {
  const booking = await bookingService.completeBooking(req.user, req.params.bookingId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking marked as completed", booking));
});

module.exports = {
  completeBookingController,
};
