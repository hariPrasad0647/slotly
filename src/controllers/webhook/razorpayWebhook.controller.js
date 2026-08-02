
const asyncHandler = require("../../utils/asyncHandler");
const logger = require("../../config/logger");
const paymentVerificationService = require("../../domains/payment/paymentVerification.service");
const refundService = require("../../domains/payment/refund.service");

const razorpayWebhookController = asyncHandler(async (req, res) => {
  const { event, payload } = req.body;

  try {
    if (event === "payment.captured") {
      const payment = payload.payment.entity;
      await paymentVerificationService.confirmPaymentFromWebhook(payment.order_id, payment.id);
    } else if (event === "payment.failed") {
      const payment = payload.payment.entity;
      await paymentVerificationService.failPaymentFromWebhook(
        payment.order_id,
        payment.error_description
      );
    } else if (event === "refund.processed" || event === "refund.failed") {
      const refund = payload.refund.entity;
      await refundService.updateRefundStatusFromWebhook(refund.id, refund.status);
    }
  } catch (error) {
    logger.error({ err: error, event }, "Failed to process Razorpay webhook");
  }

  return res.status(200).json({ success: true });
});

module.exports = {
  razorpayWebhookController,
};
