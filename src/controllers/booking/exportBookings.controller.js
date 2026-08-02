
const asyncHandler = require("../../utils/asyncHandler");
const bookingService = require("../../domains/booking/booking.service");

const exportBookingsController = asyncHandler(async (req, res) => {
  const csv = await bookingService.exportBookings(req.user, req.query);

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", 'attachment; filename="bookings.csv"');

  return res.status(200).send(csv);
});

module.exports = {
  exportBookingsController,
};
