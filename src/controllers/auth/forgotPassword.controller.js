
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const authService = require("../../domains/auth/auth.service");

const forgotPasswordController = asyncHandler(async (req, res) => {
  await authService.forgotPassword(req.body.email);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        "If an account exists for this email, a verification code has been sent"
      )
    );
});

module.exports = {
  forgotPasswordController,
};
