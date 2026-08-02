
const ApiError = require("../../utils/ApiError");

const assertPaymentAccess = (payment, { userId, hostProfileId }) => {
  const isOwner = payment.booking.userId === userId;
  const isHost = Boolean(hostProfileId) && payment.booking.hostProfileId === hostProfileId;

  if (!isOwner && !isHost) {
    throw new ApiError(403, "You do not have access to this payment");
  }
};

const assertHostOwnsPayment = (payment, hostProfileId) => {
  if (payment.booking.hostProfileId !== hostProfileId) {
    throw new ApiError(403, "You do not have permission to perform this action");
  }
};

module.exports = {
  assertPaymentAccess,
  assertHostOwnsPayment,
};
