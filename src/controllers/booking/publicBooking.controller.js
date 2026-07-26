
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const bookingService = require("../../domains/booking/booking.service");

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

module.exports = {
  getPublicHostProfileController,
  getPublicSlotsController,
};
