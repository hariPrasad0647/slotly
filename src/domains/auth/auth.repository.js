
const prisma = require("../../repositories/prisma/prismaClient");

const findUserByEmail = (email) => {
  return prisma.user.findUnique({ where: { email } });
};

const findUserById = (id) => {
  return prisma.user.findUnique({ where: { id } });
};

const createUser = (data) => {
  return prisma.user.create({ data });
};

const findHostProfileByUsername = (username) => {
  return prisma.hostProfile.findUnique({ where: { username } });
};

const createUserWithHostProfile = ({ userData, hostProfileData }) => {
  return prisma.$transaction(async (tx) => {
    const user = await tx.user.create({ data: userData });

    const hostProfile = await tx.hostProfile.create({
      data: { ...hostProfileData, userId: user.id },
    });

    return { user, hostProfile };
  });
};

const updateLastLogin = (userId) => {
  return prisma.user.update({
    where: { id: userId },
    data: { lastLoginAt: new Date() },
  });
};

const updateUserPassword = (userId, password) => {
  return prisma.user.update({
    where: { id: userId },
    data: { password },
  });
};

const createRefreshToken = ({ userId, token, expiresAt }) => {
  return prisma.refreshToken.create({
    data: { userId, token, expiresAt },
  });
};

const findRefreshToken = (token) => {
  return prisma.refreshToken.findUnique({ where: { token } });
};

const revokeRefreshToken = (token) => {
  return prisma.refreshToken.updateMany({
    where: { token },
    data: { revoked: true },
  });
};

const revokeAllUserRefreshTokens = (userId) => {
  return prisma.refreshToken.updateMany({
    where: { userId, revoked: false },
    data: { revoked: true },
  });
};

const invalidatePendingOtps = (userId) => {
  return prisma.passwordResetOtp.updateMany({
    where: { userId, usedAt: null, verifiedAt: null },
    data: { expiresAt: new Date() },
  });
};

const createPasswordResetOtp = ({ userId, otpHash, expiresAt }) => {
  return prisma.passwordResetOtp.create({
    data: { userId, otpHash, expiresAt },
  });
};

const findLatestActiveOtp = (userId) => {
  return prisma.passwordResetOtp.findFirst({
    where: { userId, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
};

const findOtpById = (id) => {
  return prisma.passwordResetOtp.findUnique({ where: { id } });
};

const incrementOtpAttempts = (id) => {
  return prisma.passwordResetOtp.update({
    where: { id },
    data: { attempts: { increment: 1 } },
  });
};

const markOtpVerified = (id) => {
  return prisma.passwordResetOtp.update({
    where: { id },
    data: { verifiedAt: new Date() },
  });
};

const markOtpUsed = (id) => {
  return prisma.passwordResetOtp.update({
    where: { id },
    data: { usedAt: new Date() },
  });
};

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  findHostProfileByUsername,
  createUserWithHostProfile,
  updateLastLogin,
  updateUserPassword,
  createRefreshToken,
  findRefreshToken,
  revokeRefreshToken,
  revokeAllUserRefreshTokens,
  invalidatePendingOtps,
  createPasswordResetOtp,
  findLatestActiveOtp,
  findOtpById,
  incrementOtpAttempts,
  markOtpVerified,
  markOtpUsed,
};
