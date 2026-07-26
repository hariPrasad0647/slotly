
const crypto = require("crypto");
const bcrypt = require("bcryptjs");

const env = require("../config/env");

const hashPassword = async (plainPassword) => {
  return bcrypt.hash(plainPassword, env.BCRYPT_SALT_ROUNDS);
};

const comparePassword = async (plainPassword, hash) => {
  return bcrypt.compare(plainPassword, hash);
};

const generateOtp = (length = env.OTP_LENGTH) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;

  return crypto.randomInt(min, max + 1).toString();
};

const sha256 = (value) => {
  return crypto.createHash("sha256").update(value).digest("hex");
};

const timingSafeEqualHex = (candidateHash, storedHash) => {
  const candidateBuffer = Buffer.from(candidateHash);
  const storedBuffer = Buffer.from(storedHash);

  if (candidateBuffer.length !== storedBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidateBuffer, storedBuffer);
};

const hashOtp = (otp) => sha256(otp);

const compareOtp = (otp, hash) => timingSafeEqualHex(hashOtp(otp), hash);

const generateRandomToken = (bytes = 40) => {
  return crypto.randomBytes(bytes).toString("hex");
};

const hashToken = (token) => sha256(token);

module.exports = {
  hashPassword,
  comparePassword,
  generateOtp,
  hashOtp,
  compareOtp,
  generateRandomToken,
  hashToken,
};
