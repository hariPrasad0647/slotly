
const jwt = require("jsonwebtoken");
const dayjs = require("dayjs");

const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const {
  hashPassword,
  comparePassword,
  generateOtp,
  hashOtp,
  compareOtp,
  generateRandomToken,
  hashToken,
} = require("../../utils/crypto");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const welcomeTemplate = require("../../templates/emails/welcome.template");
const passwordResetOtpTemplate = require("../../templates/emails/passwordResetOtp.template");
const logger = require("../../config/logger");
const generateUsername = require("../../utils/generateUsername");

const authRepository = require("./auth.repository");
const { assertUserIsActive } = require("./auth.policy");

const RESET_TOKEN_PURPOSE = "password_reset";
const MAX_USERNAME_ATTEMPTS = 5;

const isUsernameConflict = (error) =>
  error.code === "P2002" &&
  ["username", "slug"].some((field) => error.meta?.target?.includes(field));

const createAdminWithHostProfile = async (userData) => {
  const base = generateUsername(userData.firstName, userData.lastName);
  const displayName = `${userData.firstName} ${userData.lastName || ""}`.trim();

  let lastError;

  for (let attempt = 0; attempt < MAX_USERNAME_ATTEMPTS; attempt += 1) {
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const username = attempt === 0 ? base : `${base}-${suffix}`;

    try {
      const { user } = await authRepository.createUserWithHostProfile({
        userData,
        hostProfileData: { username, slug: username, displayName },
      });

      return user;
    } catch (error) {
      if (error.code === "P2002" && error.meta?.target?.includes("email")) {
        throw new ApiError(409, "An account with this email already exists");
      }

      if (isUsernameConflict(error)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError;
};

const sanitizeUser = (user) => {
  const { password, ...safeUser } = user;
  return safeUser;
};

const signAccessToken = (user) => {
  return jwt.sign({ sub: user.id, role: user.role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });
};

const issueTokens = async (user) => {
  const accessToken = signAccessToken(user);

  const refreshToken = generateRandomToken();
  const expiresAt = dayjs().add(env.REFRESH_TOKEN_EXPIRES_DAYS, "day").toDate();

  await authRepository.createRefreshToken({
    userId: user.id,
    token: hashToken(refreshToken),
    expiresAt,
  });

  return { accessToken, refreshToken };
};

const register = async ({
  email,
  password,
  firstName,
  lastName,
  phoneNumber,
  role,
}) => {
  const existingUser = await authRepository.findUserByEmail(email);

  if (existingUser) {
    throw new ApiError(409, "An account with this email already exists");
  }

  const hashedPassword = await hashPassword(password);

  const userData = {
    email,
    password: hashedPassword,
    firstName,
    lastName,
    phoneNumber,
    role,
  };

  const user =
    role === "ADMIN"
      ? await createAdminWithHostProfile(userData)
      : await authRepository.createUser(userData);

  sendEmail({
    to: user.email,
    ...welcomeTemplate({ firstName: user.firstName }),
  }).catch((error) => {
    logger.error({ err: error, userId: user.id }, "Failed to send welcome email");
  });

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), ...tokens };
};

const login = async ({ email, password }) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw new ApiError(401, "Invalid email or password");
  }

  assertUserIsActive(user);

  const isPasswordValid = await comparePassword(password, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid email or password");
  }

  await authRepository.updateLastLogin(user.id);

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), ...tokens };
};

const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }

  const tokenHash = hashToken(refreshToken);
  const storedToken = await authRepository.findRefreshToken(tokenHash);

  if (!storedToken || storedToken.revoked || storedToken.expiresAt < new Date()) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  const user = await authRepository.findUserById(storedToken.userId);

  if (!user) {
    throw new ApiError(401, "Invalid or expired refresh token");
  }

  assertUserIsActive(user);

  await authRepository.revokeRefreshToken(tokenHash);

  const tokens = await issueTokens(user);

  return { user: sanitizeUser(user), ...tokens };
};

const logout = async (refreshToken) => {
  if (!refreshToken) {
    return;
  }

  await authRepository.revokeRefreshToken(hashToken(refreshToken));
};

const forgotPassword = async (email) => {
  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    return;
  }

  await authRepository.invalidatePendingOtps(user.id);

  const otp = generateOtp();
  const expiresAt = dayjs().add(env.OTP_EXPIRY_MINUTES, "minute").toDate();

  await authRepository.createPasswordResetOtp({
    userId: user.id,
    otpHash: hashOtp(otp),
    expiresAt,
  });

  await sendEmail({
    to: user.email,
    ...passwordResetOtpTemplate({
      firstName: user.firstName,
      otp,
      expiryMinutes: env.OTP_EXPIRY_MINUTES,
    }),
  });
};

const verifyOtp = async ({ email, otp }) => {
  const invalidOtpError = new ApiError(400, "Invalid or expired OTP");

  const user = await authRepository.findUserByEmail(email);

  if (!user) {
    throw invalidOtpError;
  }

  const otpRecord = await authRepository.findLatestActiveOtp(user.id);

  if (!otpRecord || otpRecord.verifiedAt || otpRecord.expiresAt < new Date()) {
    throw invalidOtpError;
  }

  if (otpRecord.attempts >= env.OTP_MAX_ATTEMPTS) {
    throw invalidOtpError;
  }

  const isOtpValid = compareOtp(otp, otpRecord.otpHash);

  if (!isOtpValid) {
    await authRepository.incrementOtpAttempts(otpRecord.id);
    throw invalidOtpError;
  }

  await authRepository.markOtpVerified(otpRecord.id);

  const resetToken = jwt.sign(
    { sub: user.id, otpId: otpRecord.id, purpose: RESET_TOKEN_PURPOSE },
    env.JWT_SECRET,
    { expiresIn: env.RESET_TOKEN_EXPIRES_IN }
  );

  return { resetToken };
};

const resetPassword = async ({ resetToken, newPassword }) => {
  const invalidTokenError = new ApiError(400, "Invalid or expired reset token");

  let payload;

  try {
    payload = jwt.verify(resetToken, env.JWT_SECRET);
  } catch (error) {
    throw invalidTokenError;
  }

  if (payload.purpose !== RESET_TOKEN_PURPOSE) {
    throw invalidTokenError;
  }

  const otpRecord = await authRepository.findOtpById(payload.otpId);

  if (
    !otpRecord ||
    otpRecord.userId !== payload.sub ||
    !otpRecord.verifiedAt ||
    otpRecord.usedAt
  ) {
    throw invalidTokenError;
  }

  const user = await authRepository.findUserById(payload.sub);

  if (!user) {
    throw invalidTokenError;
  }

  const hashedPassword = await hashPassword(newPassword);

  await authRepository.updateUserPassword(user.id, hashedPassword);
  await authRepository.markOtpUsed(otpRecord.id);
  await authRepository.revokeAllUserRefreshTokens(user.id);
};

module.exports = {
  register,
  login,
  refreshAccessToken,
  logout,
  forgotPassword,
  verifyOtp,
  resetPassword,
};
