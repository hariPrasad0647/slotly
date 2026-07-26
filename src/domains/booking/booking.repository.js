
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

const findPublicOpenSlots = (hostProfileId, { from, to } = {}) => {
  return prisma.slot.findMany({
    where: {
      hostProfileId,
      isBooked: false,
      startsAt: {
        gte: from || new Date(),
        ...(to ? { lte: to } : {}),
      },
    },
    orderBy: { startsAt: "asc" },
  });
};

const findPublicHostProfile = (usernameOrSlug) => {
  return prisma.hostProfile.findFirst({
    where: {
      isPublic: true,
      OR: [{ username: usernameOrSlug }, { slug: usernameOrSlug }],
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
    include: { slot: true, hostProfile: HOST_PROFILE_WITH_USER },
  });
};

const findBookingsForUser = (userId, { status } = {}) => {
  return prisma.booking.findMany({
    where: { userId, ...(status ? { status } : {}) },
    orderBy: { startsAt: "desc" },
    include: { slot: true, hostProfile: true },
  });
};

const setBookingMeetingUrl = (id, meetingUrl) => {
  return prisma.booking.update({ where: { id }, data: { meetingUrl } });
};

const findBookingsForHost = (hostProfileId, { status } = {}) => {
  return prisma.booking.findMany({
    where: { hostProfileId, ...(status ? { status } : {}) },
    orderBy: { startsAt: "desc" },
  });
};

module.exports = {
  findSlotById,
  findSlotsForHost,
  findPublicOpenSlots,
  findPublicHostProfile,
  deleteSlot,
  createBooking,
  findBookingById,
  findBookingsForUser,
  findBookingsForHost,
  setBookingMeetingUrl,
};
