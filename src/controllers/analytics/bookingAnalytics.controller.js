
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const analyticsService = require("../../domains/analytics/analytics.service");

const getBookingsByDayController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getBookingsByDayChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Bookings-by-day chart fetched successfully", chart));
});

const getTopBookingDaysController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getTopBookingDaysChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Top booking days chart fetched successfully", chart));
});

const getPopularSlotsController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getPopularSlotsChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Popular slots chart fetched successfully", chart));
});

const getPeakBookingHoursController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getPeakBookingHoursChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Peak booking hours chart fetched successfully", chart));
});

module.exports = {
  getBookingsByDayController,
  getTopBookingDaysController,
  getPopularSlotsController,
  getPeakBookingHoursController,
};
