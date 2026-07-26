
const meetingInfoBlock = require("./meetingInfoBlock");

const bookingRescheduledTemplate = ({
  clientName,
  hostDisplayName,
  newStartsAt,
  timezone,
  bookingReference,
  rescheduledBy,
  meeting,
}) => {
  const subject = `Booking rescheduled: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your booking has been rescheduled</h2>
      <p>Hi ${clientName},</p>
      <p>Your session with ${hostDisplayName} has been rescheduled${
        rescheduledBy === "host" ? " by the host" : ""
      } to:</p>
      <p style="font-size: 18px; font-weight: bold;">${newStartsAt} (${timezone})</p>
      ${meeting ? meetingInfoBlock(meeting) : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = bookingRescheduledTemplate;
