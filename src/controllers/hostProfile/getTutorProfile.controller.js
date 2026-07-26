
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const hostProfileService = require("../../domains/hostProfile/hostProfile.service");

const getTutorProfileController = asyncHandler(async (req, res) => {
  const result = await hostProfileService.getOwnProfile(req.user.id);

  return res
    .status(200)
    .json(new ApiResponse(200, "Tutor profile fetched successfully", result));
});

module.exports = {
  getTutorProfileController,
};
