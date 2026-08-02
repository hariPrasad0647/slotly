
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const analyticsService = require("../../domains/analytics/analytics.service");

const getDashboardSummaryController = asyncHandler(async (req, res) => {
  const summary = await analyticsService.getDashboardSummary(req.user.id, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Dashboard summary fetched successfully", summary));
});

module.exports = {
  getDashboardSummaryController,
};
