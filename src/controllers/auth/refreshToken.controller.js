
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const {
  REFRESH_TOKEN_COOKIE,
  setRefreshTokenCookie,
} = require("../../utils/cookies");
const authService = require("../../domains/auth/auth.service");

const refreshTokenController = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.[REFRESH_TOKEN_COOKIE] || req.body?.refreshToken;

  const { user, accessToken, refreshToken } =
    await authService.refreshAccessToken(incomingRefreshToken);

  setRefreshTokenCookie(res, refreshToken);

  return res
    .status(200)
    .json(new ApiResponse(200, "Token refreshed successfully", {
      user,
      accessToken,
    }));
});

module.exports = {
  refreshTokenController,
};
