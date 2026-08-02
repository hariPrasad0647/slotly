
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const razorpay = require("../../config/razorpay");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const refundProcessedTemplate = require("../../templates/emails/refundProcessed.template");
const paymentRepository = require("./payment.repository");
const { assertHostOwnsPayment } = require("./payment.policy");
const availabilityService = require("../availability/availability.service");

const sendEmailSafely = (options) => {
  sendEmail(options).catch((error) => {
    logger.error({ err: error, to: options.to }, "Failed to send refund email");
  });
};

const createRefund = async (userId, paymentId, { amount, reason }) => {
  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  assertHostOwnsPayment(payment, hostProfile.id);

  if (payment.status !== "PAID") {
    throw new ApiError(422, `Cannot refund a payment with status ${payment.status}`);
  }

  const alreadyRefunded = await paymentRepository.sumRefundedForPayment(paymentId);
  const refundableAmount = payment.amount - alreadyRefunded;

  if (refundableAmount <= 0) {
    throw new ApiError(422, "This payment has already been fully refunded");
  }

  const refundAmount = amount || refundableAmount;

  if (refundAmount > refundableAmount) {
    throw new ApiError(
      422,
      `Refund amount cannot exceed the refundable balance of ${refundableAmount}`
    );
  }

  let razorpayRefund;

  try {
    razorpayRefund = await razorpay.payments.refund(payment.providerPaymentId, {
      amount: refundAmount,
      notes: reason ? { reason } : undefined,
    });
  } catch (error) {
    logger.error(
      { err: error.error || error.message, paymentId: payment.id },
      "Failed to create Razorpay refund"
    );
    throw new ApiError(502, "Could not process refund. Please try again.");
  }

  const status = razorpayRefund.status === "processed" ? "PROCESSED" : "PENDING";

  const refund = await paymentRepository.createRefund({
    paymentId: payment.id,
    amount: refundAmount,
    reason,
    providerRefundId: razorpayRefund.id,
    status,
    refundedAt: status === "PROCESSED" ? new Date() : null,
  });

  const isFullyRefunded = alreadyRefunded + refundAmount >= payment.amount;

  if (isFullyRefunded && status === "PROCESSED") {
    await paymentRepository.markRefunded(payment.id);
  }

  sendEmailSafely({
    to: payment.booking.clientEmail,
    ...refundProcessedTemplate({
      clientName: payment.booking.clientName,
      hostDisplayName: payment.booking.hostProfile.displayName,
      bookingReference: payment.booking.bookingReference,
      amount: refundAmount,
      currency: payment.currency,
      reason,
    }),
  });

  return refund;
};

const updateRefundStatusFromWebhook = async (providerRefundId, providerStatus) => {
  const status = providerStatus === "processed" ? "PROCESSED" : "FAILED";

  const result = await paymentRepository.updateRefundByProviderRefundId(providerRefundId, {
    status,
    refundedAt: status === "PROCESSED" ? new Date() : null,
  });

  return result.count > 0;
};

module.exports = {
  createRefund,
  updateRefundStatusFromWebhook,
};
