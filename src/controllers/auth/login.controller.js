
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const { setRefreshTokenCookie } = require("../../utils/cookies");
const authService = require("../../domains/auth/auth.service");

const loginController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.login(
    req.body
  );

  setRefreshTokenCookie(res, refreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, "Logged in successfully", {
      user,
      accessToken,
    }));
});

module.exports = {
  loginController,
};
