
const crypto = require("crypto");

const env = require("../config/env");
const ApiError = require("../utils/ApiError");

const verifyRazorpaySignature = (req, res, next) => {
  const signature = req.headers["x-razorpay-signature"];

  if (!signature || !req.rawBody) {
    return next(new ApiError(400, "Missing webhook signature"));
  }

  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_WEBHOOK_SECRET)
    .update(req.rawBody)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature);

  if (
    expectedBuffer.length !== signatureBuffer.length ||
    !crypto.timingSafeEqual(expectedBuffer, signatureBuffer)
  ) {
    return next(new ApiError(400, "Invalid webhook signature"));
  }

  return next();
};

module.exports = {
  verifyRazorpaySignature,
};
