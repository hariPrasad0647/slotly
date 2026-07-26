
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const bookingDetailsController = asyncHandler(async (req, res) => {
  const booking = await bookingService.getBookingById(req.user, req.params.bookingId);

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking fetched successfully", booking));
});

module.exports = {
  bookingDetailsController,
};
