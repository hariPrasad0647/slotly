
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const createBookingController = asyncHandler(async (req, res) => {
  const { booking, payment } = await bookingService.createBooking(req.user.id, req.body);

  const message = payment
    ? "Booking created. Complete payment to confirm your session."
    : "Booking confirmed successfully";

  return res.status(201).json(new ApiResponse(201, message, { booking, payment }));
});

module.exports = {
  createBookingController,
};
