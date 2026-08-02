
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

const downloadIcsController = asyncHandler(async (req, res) => {
  const { filename, content } = await bookingService.getBookingCalendar(
    req.user,
    req.params.bookingId,
    "ics"
  );

  res.setHeader("Content-Type", "text/calendar; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  return res.status(200).send(content);
});

const googleCalendarLinkController = asyncHandler(async (req, res) => {
  const { url } = await bookingService.getBookingCalendar(
    req.user,
    req.params.bookingId,
    "google"
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Google Calendar link generated", { url }));
});

module.exports = {
  downloadIcsController,
  googleCalendarLinkController,
};
