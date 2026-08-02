
const prisma = require("../../repositories/prisma/prismaClient");

const dateRangeFilter = (from, to) => ({
  ...(from ? { gte: from } : {}),
  ...(to ? { lte: to } : {}),
});

const countBookings = (hostProfileId, { from, to, statuses } = {}) => {
  return prisma.booking.count({
    where: {
      hostProfileId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(from || to ? { startsAt: dateRangeFilter(from, to) } : {}),
    },
  });
};

const countUpcomingConfirmed = (hostProfileId, from) => {
  return prisma.booking.count({
    where: {
      hostProfileId,
      status: "CONFIRMED",
      startsAt: { gt: from },
    },
  });
};

const sumRevenue = async (hostProfileId, { from, to } = {}) => {
  const result = await prisma.payment.aggregate({
    where: {
      status: "PAID",
      booking: { hostProfileId },
      ...(from || to ? { paidAt: dateRangeFilter(from, to) } : {}),
    },
    _sum: { amount: true },
  });

  return result._sum.amount || 0;
};

const findBookingsForCharts = (hostProfileId, { from, to, statuses } = {}) => {
  return prisma.booking.findMany({
    where: {
      hostProfileId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(from || to ? { startsAt: dateRangeFilter(from, to) } : {}),
    },
    select: { startsAt: true, status: true, timezone: true },
  });
};

const findPaymentsForRevenueChart = (hostProfileId, { from, to } = {}) => {
  return prisma.payment.findMany({
    where: {
      status: "PAID",
      booking: { hostProfileId },
      ...(from || to ? { paidAt: dateRangeFilter(from, to) } : {}),
    },
    select: { amount: true, paidAt: true },
  });
};

const countBookingsCreated = (hostProfileId, { from, to, statuses } = {}) => {
  return prisma.booking.count({
    where: {
      hostProfileId,
      ...(statuses ? { status: { in: statuses } } : {}),
      ...(from || to ? { createdAt: dateRangeFilter(from, to) } : {}),
    },
  });
};

const findClientEmailsForHost = (hostProfileId, { from, to } = {}) => {
  return prisma.booking.findMany({
    where: {
      hostProfileId,
      status: { not: "PENDING" },
      ...(from || to ? { createdAt: dateRangeFilter(from, to) } : {}),
    },
    select: { clientEmail: true },
  });
};

const recordProfileView = (data) => {
  return prisma.profileView.create({ data });
};

const countProfileViews = (hostProfileId, { from, to } = {}) => {
  return prisma.profileView.count({
    where: {
      hostProfileId,
      ...(from || to ? { createdAt: dateRangeFilter(from, to) } : {}),
    },
  });
};

const countUniqueVisitors = async (hostProfileId, { from, to } = {}) => {
  const distinctVisitors = await prisma.profileView.findMany({
    where: {
      hostProfileId,
      ...(from || to ? { createdAt: dateRangeFilter(from, to) } : {}),
    },
    distinct: ["visitorId"],
    select: { visitorId: true },
  });

  return distinctVisitors.length;
};

module.exports = {
  countBookings,
  countUpcomingConfirmed,
  sumRevenue,
  findBookingsForCharts,
  findPaymentsForRevenueChart,
  countBookingsCreated,
  findClientEmailsForHost,
  recordProfileView,
  countProfileViews,
  countUniqueVisitors,
};
