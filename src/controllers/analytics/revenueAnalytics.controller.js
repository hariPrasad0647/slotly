
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const analyticsService = require("../../domains/analytics/analytics.service");

const getRevenueTrendController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getRevenueTrendChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Revenue trend chart fetched successfully", chart));
});

const getMonthlyGrowthController = asyncHandler(async (req, res) => {
  const chart = await analyticsService.getMonthlyGrowthChart(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Monthly growth chart fetched successfully", chart));
});

module.exports = {
  getRevenueTrendController,
  getMonthlyGrowthController,
};
