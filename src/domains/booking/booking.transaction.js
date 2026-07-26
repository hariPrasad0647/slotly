
const prisma = require("../../repositories/prisma/prismaClient");
const ApiError = require("../../utils/ApiError");
const generateBookingCode = require("../../utils/generateBookingCode");

const ACTIVE_STATUSES = ["PENDING", "CONFIRMED"];

const claimSlotAndCreateBooking = async ({
  slotId,
  userId,
  clientName,
  clientEmail,
  notes,
  source,
}) => {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });

    if (!slot) {
      throw new ApiError(404, "Slot not found");
    }

    if (slot.isBooked) {
      throw new ApiError(409, "This slot has already been booked");
    }

    if (slot.startsAt <= new Date()) {
      throw new ApiError(422, "Cannot book a slot in the past");
    }

    const claim = await tx.slot.updateMany({
      where: { id: slotId, isBooked: false },
      data: { isBooked: true },
    });

    if (claim.count === 0) {
      throw new ApiError(409, "This slot has already been booked");
    }

    const booking = await tx.booking.create({
      data: {
        hostProfileId: slot.hostProfileId,
        userId,
        slotId: slot.id,
        bookingReference: generateBookingCode(),
        source,
        status: "CONFIRMED",
        clientName,
        clientEmail,
        notes,
        startsAt: slot.startsAt,
        endsAt: slot.endsAt,
        timezone: slot.timezone,
      },
    });

    return booking;
  });
};

const cancelBookingAndReleaseSlot = async ({ bookingId, cancellationReason }) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw new ApiError(
        409,
        `Booking cannot be cancelled from status ${booking.status}`
      );
    }

    const cancelledAt = new Date();

    const claim = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: ACTIVE_STATUSES } },
      data: { status: "CANCELLED", cancelledAt, cancellationReason },
    });

    if (claim.count === 0) {
      throw new ApiError(
        409,
        "This booking was already modified by another request"
      );
    }

    await tx.slot.update({
      where: { id: booking.slotId },
      data: { isBooked: false },
    });

    return { ...booking, status: "CANCELLED", cancelledAt, cancellationReason };
  });
};

const rescheduleBookingToNewSlot = async ({ bookingId, newSlotId }) => {
  return prisma.$transaction(async (tx) => {
    const booking = await tx.booking.findUnique({ where: { id: bookingId } });

    if (!booking) {
      throw new ApiError(404, "Booking not found");
    }

    if (!ACTIVE_STATUSES.includes(booking.status)) {
      throw new ApiError(
        409,
        `Booking cannot be rescheduled from status ${booking.status}`
      );
    }

    if (newSlotId === booking.slotId) {
      throw new ApiError(422, "New slot must be different from the current slot");
    }

    const newSlot = await tx.slot.findUnique({ where: { id: newSlotId } });

    if (!newSlot) {
      throw new ApiError(404, "New slot not found");
    }

    if (newSlot.hostProfileId !== booking.hostProfileId) {
      throw new ApiError(422, "New slot must belong to the same host as the original booking");
    }

    if (newSlot.isBooked) {
      throw new ApiError(409, "The new slot has already been booked");
    }

    if (newSlot.startsAt <= new Date()) {
      throw new ApiError(422, "Cannot reschedule to a slot in the past");
    }

    const rescheduleClaim = await tx.booking.updateMany({
      where: { id: bookingId, status: { in: ACTIVE_STATUSES } },
      data: { status: "RESCHEDULED" },
    });

    if (rescheduleClaim.count === 0) {
      throw new ApiError(
        409,
        "This booking was already modified by another request"
      );
    }

    const claim = await tx.slot.updateMany({
      where: { id: newSlotId, isBooked: false },
      data: { isBooked: true },
    });

    if (claim.count === 0) {
      throw new ApiError(409, "The new slot has already been booked");
    }

    await tx.slot.update({
      where: { id: booking.slotId },
      data: { isBooked: false },
    });

    const newBooking = await tx.booking.create({
      data: {
        hostProfileId: booking.hostProfileId,
        userId: booking.userId,
        slotId: newSlot.id,
        bookingReference: generateBookingCode(),
        source: booking.source,
        status: "CONFIRMED",
        clientName: booking.clientName,
        clientEmail: booking.clientEmail,
        notes: booking.notes,
        startsAt: newSlot.startsAt,
        endsAt: newSlot.endsAt,
        timezone: newSlot.timezone,
        rescheduledFromBookingId: booking.id,
      },
    });

    await tx.booking.update({
      where: { id: booking.id },
      data: { rescheduledToBookingId: newBooking.id },
    });

    return newBooking;
  });
};

const rescheduleSlotAdmin = async ({ slotId, newStartsAt, newEndsAt }) => {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });

    if (!slot) {
      throw new ApiError(404, "Slot not found");
    }

    const updatedSlot = await tx.slot.update({
      where: { id: slotId },
      data: { startsAt: newStartsAt, endsAt: newEndsAt },
    });

    let updatedBooking = null;

    if (slot.isBooked) {
      const booking = await tx.booking.findFirst({
        where: { slotId, status: { in: ACTIVE_STATUSES } },
      });

      if (booking) {
        updatedBooking = await tx.booking.update({
          where: { id: booking.id },
          data: { startsAt: newStartsAt, endsAt: newEndsAt },
        });
      }
    }

    return { slot: updatedSlot, booking: updatedBooking };
  });
};

const deleteUnbookedSlot = async (slotId) => {
  return prisma.$transaction(async (tx) => {
    const slot = await tx.slot.findUnique({ where: { id: slotId } });

    if (!slot) {
      throw new ApiError(404, "Slot not found");
    }

    if (slot.isBooked) {
      throw new ApiError(
        409,
        "This slot is already booked. Cancel or reschedule the booking before deleting it."
      );
    }

    try {
      await tx.slot.delete({ where: { id: slotId } });
    } catch (error) {
      if (error.code === "P2003") {
        throw new ApiError(
          409,
          "This slot was just booked by someone else and can no longer be deleted"
        );
      }

      throw error;
    }

    return slot;
  });
};

module.exports = {
  claimSlotAndCreateBooking,
  cancelBookingAndReleaseSlot,
  rescheduleBookingToNewSlot,
  rescheduleSlotAdmin,
  deleteUnbookedSlot,
};
