
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const hostProfileService = require("../../domains/hostProfile/hostProfile.service");

const updateTutorProfileController = asyncHandler(async (req, res) => {
  const result = await hostProfileService.updateOwnProfile(req.user.id, req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "Tutor profile updated successfully", result));
});

module.exports = {
  updateTutorProfileController,
};
