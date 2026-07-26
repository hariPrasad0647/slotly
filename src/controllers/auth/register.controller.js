
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const { setRefreshTokenCookie } = require("../../utils/cookies");
const authService = require("../../domains/auth/auth.service");

const registerController = asyncHandler(async (req, res) => {
  const { user, accessToken, refreshToken } = await authService.register(
    req.body
  );

  setRefreshTokenCookie(res, refreshToken);

  return res
    .status(201)
    .json(new ApiResponse(201, "Account created successfully", {
      user,
      accessToken,
    }));
});

module.exports = {
  registerController,
};
