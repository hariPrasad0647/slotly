
const hostBookingCancelledTemplate = ({
  hostDisplayName,
  clientName,
  startsAt,
  timezone,
  bookingReference,
  cancellationReason,
}) => {
  const subject = `Booking cancelled: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>A booking has been cancelled</h2>
      <p>Hi ${hostDisplayName},</p>
      <p>Your session with <strong>${clientName}</strong> originally scheduled for:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      <p>has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ""}</p>
      <p>The slot is now free for other bookings.</p>
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = hostBookingCancelledTemplate;
