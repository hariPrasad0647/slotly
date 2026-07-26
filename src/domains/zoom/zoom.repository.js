
const prisma = require("../../repositories/prisma/prismaClient");

const create = (data) => {
  return prisma.zoomMeeting.create({ data });
};

const findByBookingId = (bookingId) => {
  return prisma.zoomMeeting.findUnique({ where: { bookingId } });
};

const update = (id, data) => {
  return prisma.zoomMeeting.update({ where: { id }, data });
};

const moveToBooking = (id, { bookingId, startsAt, endsAt }) => {
  return prisma.zoomMeeting.update({
    where: { id },
    data: { bookingId, startsAt, endsAt },
  });
};

const deleteByBookingId = (bookingId) => {
  return prisma.zoomMeeting.deleteMany({ where: { bookingId } });
};

module.exports = {
  create,
  findByBookingId,
  update,
  moveToBooking,
  deleteByBookingId,
};
