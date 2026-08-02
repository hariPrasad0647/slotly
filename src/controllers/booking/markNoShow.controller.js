
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const markNoShowController = asyncHandler(async (req, res) => {
  const booking = await bookingService.markNoShow(req.user, req.params.bookingId, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Booking marked as no-show", booking));
});

module.exports = {
  markNoShowController,
};
