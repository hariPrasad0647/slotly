
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const {
  REFRESH_TOKEN_COOKIE,
  clearRefreshTokenCookie,
} = require("../../utils/cookies");
const authService = require("../../domains/auth/auth.service");

const logoutController = asyncHandler(async (req, res) => {
  const refreshToken =
    req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

  await authService.logout(refreshToken);

  clearRefreshTokenCookie(res);

  return res.status(200).json(new ApiResponse(200, "Logged out successfully"));
});

module.exports = {
  logoutController,
};
