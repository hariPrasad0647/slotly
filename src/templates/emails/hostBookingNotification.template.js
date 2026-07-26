
const meetingInfoBlock = require("./meetingInfoBlock");

const hostBookingNotificationTemplate = ({
  hostDisplayName,
  clientName,
  clientEmail,
  startsAt,
  timezone,
  bookingReference,
  notes,
  meeting,
}) => {
  const subject = `New booking: ${clientName} on ${startsAt}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>You have a new booking</h2>
      <p>Hi ${hostDisplayName},</p>
      <p><strong>${clientName}</strong> (${clientEmail}) booked a session with you for:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      ${notes ? `<p>Notes from ${clientName}: ${notes}</p>` : ""}
      ${meeting ? meetingInfoBlock(meeting) : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = hostBookingNotificationTemplate;
