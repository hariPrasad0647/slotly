
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const createBookingController = asyncHandler(async (req, res) => {
  const booking = await bookingService.createBooking(req.user.id, req.body);

  return res
    .status(201)
    .json(new ApiResponse(201, "Booking confirmed successfully", booking));
});

module.exports = {
  createBookingController,
};
