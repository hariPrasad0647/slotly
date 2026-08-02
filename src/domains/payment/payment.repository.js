
const prisma = require("../../repositories/prisma/prismaClient");

const create = (data) => {
  return prisma.payment.create({ data });
};

const findByBookingId = (bookingId) => {
  return prisma.payment.findFirst({
    where: { bookingId },
    orderBy: { createdAt: "desc" },
  });
};

const findByProviderOrderId = (providerOrderId) => {
  return prisma.payment.findUnique({ where: { providerOrderId } });
};

const PAYMENT_DETAIL_INCLUDE = {
  booking: {
    include: {
      hostProfile: {
        include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } },
      },
      couponRedemption: { include: { coupon: true } },
    },
  },
  refunds: { orderBy: { createdAt: "desc" } },
};

const findById = (id) => {
  return prisma.payment.findUnique({
    where: { id },
    include: PAYMENT_DETAIL_INCLUDE,
  });
};

const markPaid = (id, { providerPaymentId, providerSignature }) => {
  return prisma.payment.update({
    where: { id },
    data: {
      status: "PAID",
      providerPaymentId,
      providerSignature,
      paidAt: new Date(),
    },
  });
};

const markFailed = (id, failureReason) => {
  return prisma.payment.update({
    where: { id },
    data: { status: "FAILED", failedAt: new Date(), failureReason },
  });
};

const markRefunded = (id) => {
  return prisma.payment.update({
    where: { id },
    data: { status: "REFUNDED", refundedAt: new Date() },
  });
};

const buildHistoryWhere = ({ status, from, to } = {}) => ({
  ...(status ? { status } : {}),
  ...(from || to
    ? {
        createdAt: {
          ...(from ? { gte: from } : {}),
          ...(to ? { lte: to } : {}),
        },
      }
    : {}),
});

const findForUser = async (userId, filters = {}) => {
  const { page = 1, pageSize = 20 } = filters;
  const where = { booking: { userId }, ...buildHistoryWhere(filters) };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: PAYMENT_DETAIL_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

const findForHost = async (hostProfileId, filters = {}) => {
  const { page = 1, pageSize = 20 } = filters;
  const where = { booking: { hostProfileId }, ...buildHistoryWhere(filters) };

  const [data, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: PAYMENT_DETAIL_INCLUDE,
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.payment.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

const createRefund = (data) => {
  return prisma.refund.create({ data });
};

const updateRefundByProviderRefundId = (providerRefundId, data) => {
  return prisma.refund.updateMany({ where: { providerRefundId }, data });
};

const sumRefundedForPayment = async (paymentId) => {
  const result = await prisma.refund.aggregate({
    where: { paymentId, status: { in: ["PENDING", "PROCESSED"] } },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
};

module.exports = {
  create,
  findByBookingId,
  findByProviderOrderId,
  findById,
  findForUser,
  findForHost,
  markPaid,
  markFailed,
  markRefunded,
  createRefund,
  updateRefundByProviderRefundId,
  sumRefundedForPayment,
};
