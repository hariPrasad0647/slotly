
const express = require("express");

const { registerController } = require("../controllers/auth/register.controller");
const { loginController } = require("../controllers/auth/login.controller");
const { logoutController } = require("../controllers/auth/logout.controller");
const {
  refreshTokenController,
} = require("../controllers/auth/refreshToken.controller");
const {
  forgotPasswordController,
} = require("../controllers/auth/forgotPassword.controller");
const { verifyOtpController } = require("../controllers/auth/verifyOtp.controller");
const {
  resetPasswordController,
} = require("../controllers/auth/resetPassword.controller");

const validate = require("../middlewares/validate.middleware");
const {
  loginRateLimiter,
  forgotPasswordRateLimiter,
  verifyOtpRateLimiter,
} = require("../middlewares/rateLimit.middleware");

const {
  registerSchema,
  loginSchema,
  logoutSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  verifyOtpSchema,
  resetPasswordSchema,
} = require("../validators/auth.validator");

const router = express.Router();

router.post("/register", validate(registerSchema), registerController);

router.post("/login", loginRateLimiter, validate(loginSchema), loginController);

router.post("/logout", validate(logoutSchema), logoutController);

router.post(
  "/refresh-token",
  validate(refreshTokenSchema),
  refreshTokenController
);

router.post(
  "/forgot-password",
  forgotPasswordRateLimiter,
  validate(forgotPasswordSchema),
  forgotPasswordController
);

router.post(
  "/verify-otp",
  verifyOtpRateLimiter,
  validate(verifyOtpSchema),
  verifyOtpController
);

router.post(
  "/reset-password",
  validate(resetPasswordSchema),
  resetPasswordController
);

module.exports = router;
