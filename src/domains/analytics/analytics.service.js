
const crypto = require("crypto");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const availabilityService = require("../availability/availability.service");
const bookingRepository = require("../booking/booking.repository");
const analyticsRepository = require("./analytics.repository");

const HAPPENED_STATUSES = ["CONFIRMED", "COMPLETED", "NO_SHOW"];
const WEEKDAY_LABELS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const startOfWeekMonday = (date) => {
  const day = dayjs(date).day();
  const diffToMonday = day === 0 ? 6 : day - 1;
  return dayjs(date).subtract(diffToMonday, "day").startOf("day");
};

const safeRate = (numerator, denominator) =>
  denominator > 0 ? Math.round((numerator / denominator) * 1000) / 10 : 0;

const getDashboardSummary = async (userId, { from, to } = {}) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);
  const now = new Date();

  const todayStart = dayjs(now).startOf("day").toDate();
  const todayEnd = dayjs(now).endOf("day").toDate();
  const weekStart = startOfWeekMonday(now).toDate();
  const weekEnd = startOfWeekMonday(now).add(6, "day").endOf("day").toDate();

  const [
    todaysBookings,
    thisWeeksBookings,
    totalBookings,
    revenue,
    upcomingSessions,
    completed,
    noShow,
    cancellations,
    bookingsCreated,
    pageViews,
    visitors,
    clientEmailRows,
  ] = await Promise.all([
    analyticsRepository.countBookings(hostProfile.id, {
      from: todayStart,
      to: todayEnd,
      statuses: HAPPENED_STATUSES,
    }),
    analyticsRepository.countBookings(hostProfile.id, {
      from: weekStart,
      to: weekEnd,
      statuses: HAPPENED_STATUSES,
    }),
    analyticsRepository.countBookings(hostProfile.id, { from, to, statuses: HAPPENED_STATUSES }),
    analyticsRepository.sumRevenue(hostProfile.id, { from, to }),
    analyticsRepository.countUpcomingConfirmed(hostProfile.id, now),
    analyticsRepository.countBookings(hostProfile.id, { from, to, statuses: ["COMPLETED"] }),
    analyticsRepository.countBookings(hostProfile.id, { from, to, statuses: ["NO_SHOW"] }),
    analyticsRepository.countBookings(hostProfile.id, { from, to, statuses: ["CANCELLED"] }),
    analyticsRepository.countBookingsCreated(hostProfile.id, { from, to }),
    analyticsRepository.countProfileViews(hostProfile.id, { from, to }),
    analyticsRepository.countUniqueVisitors(hostProfile.id, { from, to }),
    analyticsRepository.findClientEmailsForHost(hostProfile.id, { from, to }),
  ]);

  const clientCounts = new Map();
  clientEmailRows.forEach(({ clientEmail }) => {
    clientCounts.set(clientEmail, (clientCounts.get(clientEmail) || 0) + 1);
  });
  const uniqueClients = clientCounts.size;
  const returningClients = [...clientCounts.values()].filter((count) => count > 1).length;

  return {
    todaysBookings,
    thisWeeksBookings,
    totalBookings,
    revenue,
    upcomingSessions,
    completionRate: safeRate(completed, completed + noShow),
    cancellations,
    cancellationRate: safeRate(cancellations, bookingsCreated),
    noShowRate: safeRate(noShow, completed + noShow),
    visitors,
    pageViews,
    bookingConversionRate: safeRate(bookingsCreated, visitors),
    uniqueClients,
    returningClients,
    returningCustomerRate: safeRate(returningClients, uniqueClients),
  };
};

const getBookingsByDayChart = async (userId, { from, to }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const rangeEnd = to ? dayjs(to) : dayjs().endOf("day");
  const rangeStart = from ? dayjs(from) : rangeEnd.subtract(29, "day").startOf("day");

  const bookings = await analyticsRepository.findBookingsForCharts(hostProfile.id, {
    from: rangeStart.toDate(),
    to: rangeEnd.toDate(),
    statuses: HAPPENED_STATUSES,
  });

  const counts = new Map();

  bookings.forEach((booking) => {
    const key = dayjs(booking.startsAt).format("YYYY-MM-DD");
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  const series = [];

  for (let cursor = rangeStart.startOf("day"); !cursor.isAfter(rangeEnd); cursor = cursor.add(1, "day")) {
    const key = cursor.format("YYYY-MM-DD");
    series.push({ date: key, count: counts.get(key) || 0 });
  }

  return series;
};

const getTopBookingDaysChart = async (userId, { from, to }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const bookings = await analyticsRepository.findBookingsForCharts(hostProfile.id, {
    from,
    to,
    statuses: HAPPENED_STATUSES,
  });

  const counts = new Array(7).fill(0);

  bookings.forEach((booking) => {
    counts[dayjs(booking.startsAt).day()] += 1;
  });

  return WEEKDAY_LABELS.map((label, index) => ({ weekday: label, count: counts[index] })).sort(
    (a, b) => b.count - a.count
  );
};

const bucketKeyFor = (date, granularity) => {
  if (granularity === "month") {
    return dayjs(date).format("YYYY-MM");
  }

  if (granularity === "week") {
    return startOfWeekMonday(date).format("YYYY-MM-DD");
  }

  return dayjs(date).format("YYYY-MM-DD");
};

const getRevenueTrendChart = async (userId, { from, to, granularity }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const defaultDays = granularity === "month" ? 365 : granularity === "week" ? 84 : 29;
  const rangeEnd = to ? dayjs(to) : dayjs().endOf("day");
  const rangeStart = from ? dayjs(from) : rangeEnd.subtract(defaultDays, "day").startOf("day");

  const payments = await analyticsRepository.findPaymentsForRevenueChart(hostProfile.id, {
    from: rangeStart.toDate(),
    to: rangeEnd.toDate(),
  });

  const totals = new Map();

  payments.forEach((payment) => {
    const key = bucketKeyFor(payment.paidAt, granularity);
    totals.set(key, (totals.get(key) || 0) + payment.amount);
  });

  const step = granularity === "month" ? "month" : granularity === "week" ? "week" : "day";
  const firstBucket =
    granularity === "week"
      ? startOfWeekMonday(rangeStart)
      : rangeStart.startOf(granularity === "month" ? "month" : "day");

  const series = [];

  for (let cursor = firstBucket; !cursor.isAfter(rangeEnd); cursor = cursor.add(1, step)) {
    series.push({ period: bucketKeyFor(cursor.toDate(), granularity), revenue: 0 });
  }

  totals.forEach((amount, key) => {
    const bucket = series.find((entry) => entry.period === key);

    if (bucket) {
      bucket.revenue = amount;
    }
  });

  return series;
};

const getMonthlyGrowthChart = async (userId, { months }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const rangeStart = dayjs().subtract(months - 1, "month").startOf("month");
  const rangeEnd = dayjs().endOf("month");

  const [bookings, payments] = await Promise.all([
    analyticsRepository.findBookingsForCharts(hostProfile.id, {
      from: rangeStart.toDate(),
      to: rangeEnd.toDate(),
      statuses: HAPPENED_STATUSES,
    }),
    analyticsRepository.findPaymentsForRevenueChart(hostProfile.id, {
      from: rangeStart.toDate(),
      to: rangeEnd.toDate(),
    }),
  ]);

  const bookingCounts = new Map();
  const revenueTotals = new Map();

  bookings.forEach((booking) => {
    const key = dayjs(booking.startsAt).format("YYYY-MM");
    bookingCounts.set(key, (bookingCounts.get(key) || 0) + 1);
  });

  payments.forEach((payment) => {
    const key = dayjs(payment.paidAt).format("YYYY-MM");
    revenueTotals.set(key, (revenueTotals.get(key) || 0) + payment.amount);
  });

  const monthKeys = [];

  for (let cursor = rangeStart; !cursor.isAfter(rangeEnd); cursor = cursor.add(1, "month")) {
    monthKeys.push(cursor.format("YYYY-MM"));
  }

  const growthPercent = (current, previous) => {
    if (previous === 0) {
      return current > 0 ? 100 : 0;
    }

    return Math.round(((current - previous) / previous) * 1000) / 10;
  };

  return monthKeys.map((month, index) => {
    const bookingCount = bookingCounts.get(month) || 0;
    const revenue = revenueTotals.get(month) || 0;
    const previousMonth = index > 0 ? monthKeys[index - 1] : null;

    return {
      month,
      bookingCount,
      revenue,
      bookingGrowthPercent:
        previousMonth === null ? null : growthPercent(bookingCount, bookingCounts.get(previousMonth) || 0),
      revenueGrowthPercent:
        previousMonth === null ? null : growthPercent(revenue, revenueTotals.get(previousMonth) || 0),
    };
  });
};

const getPopularSlotsChart = async (userId, { from, to }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const bookings = await analyticsRepository.findBookingsForCharts(hostProfile.id, {
    from,
    to,
    statuses: HAPPENED_STATUSES,
  });

  const counts = new Map();

  bookings.forEach((booking) => {
    const key = dayjs(booking.startsAt).tz(booking.timezone).format("HH:mm");
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...counts.entries()]
    .map(([time, count]) => ({ time, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 20);
};

const getPeakBookingHoursChart = async (userId, { from, to }) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const bookings = await analyticsRepository.findBookingsForCharts(hostProfile.id, {
    from,
    to,
    statuses: HAPPENED_STATUSES,
  });

  const counts = new Array(24).fill(0);

  bookings.forEach((booking) => {
    const hour = dayjs(booking.startsAt).tz(booking.timezone).hour();
    counts[hour] += 1;
  });

  return counts.map((count, hour) => ({ hour, count }));
};

const trackProfileView = async (usernameOrSlug, { visitorId, referrer, userAgent, ip }) => {
  const hostProfile = await bookingRepository.findPublicHostProfile(usernameOrSlug);

  if (!hostProfile) {
    return null;
  }

  const resolvedVisitorId =
    visitorId || crypto.createHash("sha256").update(`${ip || ""}${userAgent || ""}`).digest("hex");

  return analyticsRepository.recordProfileView({
    hostProfileId: hostProfile.id,
    visitorId: resolvedVisitorId,
    referrer,
    userAgent,
  });
};

module.exports = {
  getDashboardSummary,
  getBookingsByDayChart,
  getTopBookingDaysChart,
  getRevenueTrendChart,
  getMonthlyGrowthChart,
  getPopularSlotsChart,
  getPeakBookingHoursChart,
  trackProfileView,
};
