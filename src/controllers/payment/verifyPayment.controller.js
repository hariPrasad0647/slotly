
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const paymentVerificationService = require("../../domains/payment/paymentVerification.service");

const verifyPaymentController = asyncHandler(async (req, res) => {
  const booking = await paymentVerificationService.verifyAndConfirmClientPayment(
    req.body,
    req.user.id
  );

  return res
    .status(200)
    .json(new ApiResponse(200, "Payment verified and booking confirmed", booking));
});

module.exports = {
  verifyPaymentController,
};
