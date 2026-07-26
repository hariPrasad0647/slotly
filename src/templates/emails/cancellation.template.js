
const cancellationTemplate = ({
  clientName,
  hostDisplayName,
  startsAt,
  timezone,
  bookingReference,
  cancellationReason,
  hadMeeting,
}) => {
  const subject = `Booking cancelled: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your booking has been cancelled</h2>
      <p>Hi ${clientName},</p>
      <p>Your session with ${hostDisplayName} originally scheduled for:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      <p>has been cancelled.${cancellationReason ? ` Reason: ${cancellationReason}` : ""}</p>
      ${hadMeeting ? "<p>The Zoom meeting for this session has also been cancelled.</p>" : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = cancellationTemplate;
