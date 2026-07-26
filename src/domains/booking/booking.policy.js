
const ApiError = require("../../utils/ApiError");

const assertBookingAccess = (booking, { userId, hostProfileId }) => {
  const isOwner = booking.userId === userId;
  const isHost = Boolean(hostProfileId) && booking.hostProfileId === hostProfileId;

  if (!isOwner && !isHost) {
    throw new ApiError(403, "You do not have access to this booking");
  }
};

const assertBookingOwner = (booking, userId) => {
  if (booking.userId !== userId) {
    throw new ApiError(403, "You do not have access to this booking");
  }
};

const assertSlotOwnership = (slot, hostProfileId) => {
  if (!slot || slot.hostProfileId !== hostProfileId) {
    throw new ApiError(404, "Slot not found");
  }
};

module.exports = {
  assertBookingAccess,
  assertBookingOwner,
  assertSlotOwnership,
};
