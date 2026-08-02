
const ApiError = require("../../utils/ApiError");
const razorpay = require("../../config/razorpay");
const paymentRepository = require("./payment.repository");
const { assertPaymentAccess } = require("./payment.policy");
const availabilityService = require("../availability/availability.service");
const { buildPaymentReceiptPdf } = require("../../utils/receipt.util");

const createOrderForBooking = async (booking, { amount, currency }) => {
  const order = await razorpay.orders.create({
    amount,
    currency,
    receipt: booking.bookingReference,
    notes: { bookingId: booking.id },
  });

  const payment = await paymentRepository.create({
    bookingId: booking.id,
    provider: "RAZORPAY",
    providerOrderId: order.id,
    amount,
    currency,
    status: "PENDING",
  });

  return { order, payment };
};

const getPaymentHistory = async (actingUser, { scope, ...filters }) => {
  if (scope === "hosted" && actingUser.role !== "USER") {
    const hostProfile = await availabilityService.getOwnHostProfile(actingUser.id);
    return paymentRepository.findForHost(hostProfile.id, filters);
  }

  return paymentRepository.findForUser(actingUser.id, filters);
};

const getPaymentForAccess = async (actingUser, paymentId) => {
  const payment = await paymentRepository.findById(paymentId);

  if (!payment) {
    throw new ApiError(404, "Payment not found");
  }

  const hostProfile =
    actingUser.role !== "USER"
      ? await availabilityService.getOwnHostProfile(actingUser.id).catch(() => null)
      : null;

  assertPaymentAccess(payment, { userId: actingUser.id, hostProfileId: hostProfile?.id });

  return payment;
};

const getPaymentReceipt = async (actingUser, paymentId) => {
  const payment = await getPaymentForAccess(actingUser, paymentId);

  if (!["PAID", "REFUNDED"].includes(payment.status)) {
    throw new ApiError(422, "A receipt is only available for a paid payment");
  }

  const pdf = await buildPaymentReceiptPdf(payment);

  return { filename: `receipt-${payment.booking.bookingReference}.pdf`, pdf };
};

module.exports = {
  createOrderForBooking,
  getPaymentHistory,
  getPaymentForAccess,
  getPaymentReceipt,
};
