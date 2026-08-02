
const prisma = require("../../repositories/prisma/prismaClient");

const findSlotById = (id) => {
  return prisma.slot.findUnique({ where: { id } });
};

const findSlotsForHost = (hostProfileId, { from, to, isBooked } = {}) => {
  return prisma.slot.findMany({
    where: {
      hostProfileId,
      ...(isBooked !== undefined ? { isBooked } : {}),
      ...(from || to
        ? {
            startsAt: {
              ...(from ? { gte: from } : {}),
              ...(to ? { lte: to } : {}),
            },
          }
        : {}),
    },
    orderBy: { startsAt: "asc" },
  });
};

const findPublicOpenSlots = (hostProfileId, { from, to, ruleId, durationMinutes } = {}) => {
  return prisma.slot.findMany({
    where: {
      hostProfileId,
      isBooked: false,
      ...(ruleId ? { availabilityRuleId: ruleId } : {}),
      startsAt: {
        gte: from || new Date(),
        ...(to ? { lte: to } : {}),
      },
    },
    orderBy: { startsAt: "asc" },
  }).then((slots) =>
    durationMinutes
      ? slots.filter(
          (slot) => (slot.endsAt.getTime() - slot.startsAt.getTime()) / 60000 === durationMinutes
        )
      : slots
  );
};

const findPublicHostProfile = (usernameOrSlug) => {
  return prisma.hostProfile.findFirst({
    where: {
      isPublic: true,
      OR: [{ username: usernameOrSlug }, { slug: usernameOrSlug }],
    },
  });
};

const findPublicSessionTypes = (hostProfileId) => {
  return prisma.availabilityRule.findMany({
    where: { hostProfileId, isActive: true },
    orderBy: { slotDurationMinutes: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      slotDurationMinutes: true,
      isFree: true,
      price: true,
      currency: true,
      timezone: true,
    },
  });
};

const deleteSlot = (id) => {
  return prisma.slot.delete({ where: { id } });
};

const createBooking = (data) => {
  return prisma.booking.create({ data });
};

const HOST_PROFILE_WITH_USER = {
  include: {
    user: {
      select: { id: true, email: true, firstName: true, lastName: true },
    },
  },
};

const findBookingById = (id) => {
  return prisma.booking.findUnique({
    where: { id },
    include: {
      slot: true,
      hostProfile: HOST_PROFILE_WITH_USER,
      couponRedemption: { include: { coupon: true } },
    },
  });
};

const EXPORT_ROW_LIMIT = 5000;

const buildBookingFilters = ({ status, timeframe, from, to, search } = {}) => {
  const now = new Date();

  const startsAtFilter = {
    ...(from ? { gte: from } : {}),
    ...(to ? { lte: to } : {}),
    ...(timeframe === "upcoming" ? { gte: from || now } : {}),
    ...(timeframe === "past" ? { lt: to || now } : {}),
  };

  return {
    ...(status ? { status } : {}),
    ...(Object.keys(startsAtFilter).length > 0 ? { startsAt: startsAtFilter } : {}),
    ...(search
      ? {
          OR: [
            { clientName: { contains: search } },
            { clientEmail: { contains: search } },
            { bookingReference: { contains: search } },
          ],
        }
      : {}),
  };
};

const findBookingsForUser = async (userId, filters = {}) => {
  const { page = 1, pageSize = 20 } = filters;
  const where = { userId, ...buildBookingFilters(filters) };

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: { slot: true, hostProfile: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

const setBookingMeetingUrl = (id, meetingUrl) => {
  return prisma.booking.update({ where: { id }, data: { meetingUrl } });
};

const findBookingsForHost = async (hostProfileId, filters = {}) => {
  const { page = 1, pageSize = 20 } = filters;
  const where = { hostProfileId, ...buildBookingFilters(filters) };

  const [data, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      orderBy: { startsAt: "desc" },
      include: { slot: true },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.booking.count({ where }),
  ]);

  return { data, total, page, pageSize };
};

const findBookingsForUserExport = (userId, filters = {}) => {
  return prisma.booking.findMany({
    where: { userId, ...buildBookingFilters(filters) },
    orderBy: { startsAt: "desc" },
    include: { hostProfile: true },
    take: EXPORT_ROW_LIMIT,
  });
};

const findBookingsForHostExport = (hostProfileId, filters = {}) => {
  return prisma.booking.findMany({
    where: { hostProfileId, ...buildBookingFilters(filters) },
    orderBy: { startsAt: "desc" },
    take: EXPORT_ROW_LIMIT,
  });
};

module.exports = {
  findSlotById,
  findSlotsForHost,
  findPublicOpenSlots,
  findPublicHostProfile,
  findPublicSessionTypes,
  deleteSlot,
  createBooking,
  findBookingById,
  findBookingsForUser,
  findBookingsForHost,
  findBookingsForUserExport,
  findBookingsForHostExport,
  setBookingMeetingUrl,
};
