
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const getBookingsController = asyncHandler(async (req, res) => {
  const bookings = await bookingService.getBookings(req.user, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Bookings fetched successfully", bookings));
});

module.exports = {
  getBookingsController,
};
