
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const authService = require("../../domains/auth/auth.service");

const verifyOtpController = asyncHandler(async (req, res) => {
  const { resetToken } = await authService.verifyOtp(req.body);

  return res
    .status(200)
    .json(new ApiResponse(200, "OTP verified successfully", { resetToken }));
});

module.exports = {
  verifyOtpController,
};
