
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");
const analyticsService = require("../../domains/analytics/analytics.service");

const getPublicHostProfileController = asyncHandler(async (req, res) => {
  const hostProfile = await bookingService.getPublicHostProfile(req.params.username);

  return res
    .status(200)
    .json(new ApiResponse(200, "Host profile fetched successfully", hostProfile));
});

const getPublicSlotsController = asyncHandler(async (req, res) => {
  const slots = await bookingService.listPublicSlots(req.params.username, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Open slots fetched successfully", slots));
});

const getPublicSessionTypesController = asyncHandler(async (req, res) => {
  const sessionTypes = await bookingService.listPublicSessionTypes(req.params.username);

  return res
    .status(200)
    .json(new ApiResponse(200, "Session types fetched successfully", sessionTypes));
});

const trackProfileViewController = asyncHandler(async (req, res) => {
  await analyticsService.trackProfileView(req.params.username, {
    visitorId: req.body.visitorId,
    referrer: req.body.referrer || req.headers.referer,
    userAgent: req.headers["user-agent"],
    ip: req.ip,
  });

  return res.status(202).json(new ApiResponse(202, "View tracked", null));
});

module.exports = {
  getPublicHostProfileController,
  getPublicSlotsController,
  getPublicSessionTypesController,
  trackProfileViewController,
};
