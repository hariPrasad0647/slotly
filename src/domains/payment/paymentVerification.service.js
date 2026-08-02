
const crypto = require("crypto");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const env = require("../../config/env");
const ApiError = require("../../utils/ApiError");
const logger = require("../../config/logger");
const { sendEmail } = require("../../providers/email/nodemailer.provider");
const paymentReceiptTemplate = require("../../templates/emails/paymentReceipt.template");
const failedPaymentTemplate = require("../../templates/emails/failedPayment.template");
const paymentRepository = require("./payment.repository");
const bookingRepository = require("../booking/booking.repository");
const bookingService = require("../booking/booking.service");

const formatInTz = (date, timezone) => dayjs(date).tz(timezone).format("dddd, MMMM D, YYYY [at] h:mm A");

const sendEmailSafely = (options) => {
  sendEmail(options).catch((error) => {
    logger.error({ err: error, to: options.to }, "Failed to send payment email");
  });
};

const notifyPaymentReceived = async (payment) => {
  const booking = await bookingRepository.findBookingById(payment.bookingId);

  if (!booking) {
    return;
  }

  sendEmailSafely({
    to: booking.clientEmail,
    ...paymentReceiptTemplate({
      clientName: booking.clientName,
      hostDisplayName: booking.hostProfile.displayName,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      amount: payment.amount,
      currency: payment.currency,
      discountAmount: booking.couponRedemption?.discountAmount || 0,
      couponCode: booking.couponRedemption?.coupon?.code || null,
    }),
  });
};

const notifyPaymentFailed = async (payment, reason) => {
  const booking = await bookingRepository.findBookingById(payment.bookingId);

  if (!booking) {
    return;
  }

  sendEmailSafely({
    to: booking.clientEmail,
    ...failedPaymentTemplate({
      clientName: booking.clientName,
      hostDisplayName: booking.hostProfile.displayName,
      startsAt: formatInTz(booking.startsAt, booking.timezone),
      timezone: booking.timezone,
      bookingReference: booking.bookingReference,
      amount: payment.amount,
      currency: payment.currency,
      reason,
    }),
  });
};

const verifySignature = ({ orderId, paymentId, signature }) => {
  const expected = crypto
    .createHmac("sha256", env.RAZORPAY_KEY_SECRET)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");

  const expectedBuffer = Buffer.from(expected);
  const signatureBuffer = Buffer.from(signature || "");

  if (expectedBuffer.length !== signatureBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(expectedBuffer, signatureBuffer);
};

const verifyAndConfirmClientPayment = async (
  { razorpayOrderId, razorpayPaymentId, razorpaySignature },
  userId
) => {
  const isValid = verifySignature({
    orderId: razorpayOrderId,
    paymentId: razorpayPaymentId,
    signature: razorpaySignature,
  });

  if (!isValid) {
    throw new ApiError(400, "Invalid payment signature");
  }

  const payment = await paymentRepository.findByProviderOrderId(razorpayOrderId);

  if (!payment) {
    throw new ApiError(404, "Payment order not found");
  }

  const booking = await bookingRepository.findBookingById(payment.bookingId);

  if (!booking || booking.userId !== userId) {
    throw new ApiError(403, "You do not have access to this payment");
  }

  const wasAlreadyPaid = payment.status === "PAID";

  if (!wasAlreadyPaid) {
    await paymentRepository.markPaid(payment.id, {
      providerPaymentId: razorpayPaymentId,
      providerSignature: razorpaySignature,
    });
  }

  const confirmedBooking = await bookingService.confirmPendingBooking(payment.bookingId);

  if (!wasAlreadyPaid) {
    await notifyPaymentReceived(payment);
  }

  return confirmedBooking;
};

const confirmPaymentFromWebhook = async (orderId, paymentId) => {
  const payment = await paymentRepository.findByProviderOrderId(orderId);

  if (!payment) {
    return null;
  }

  const wasAlreadyPaid = payment.status === "PAID";

  if (!wasAlreadyPaid) {
    await paymentRepository.markPaid(payment.id, {
      providerPaymentId: paymentId,
      providerSignature: null,
    });
  }

  const confirmedBooking = await bookingService.confirmPendingBooking(payment.bookingId);

  if (!wasAlreadyPaid) {
    await notifyPaymentReceived(payment);
  }

  return confirmedBooking;
};

const failPaymentFromWebhook = async (orderId, reason) => {
  const payment = await paymentRepository.findByProviderOrderId(orderId);

  if (!payment || payment.status !== "PENDING") {
    return null;
  }

  await paymentRepository.markFailed(payment.id, reason || "Payment failed");

  const failedBooking = await bookingService.failPendingBooking(
    payment.bookingId,
    reason || "Payment failed"
  );

  await notifyPaymentFailed(payment, reason);

  return failedBooking;
};

module.exports = {
  verifySignature,
  verifyAndConfirmClientPayment,
  confirmPaymentFromWebhook,
  failPaymentFromWebhook,
};
