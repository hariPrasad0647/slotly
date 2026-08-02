
const meetingInfoBlock = require("./meetingInfoBlock");

const hostBookingRescheduledTemplate = ({
  hostDisplayName,
  clientName,
  newStartsAt,
  timezone,
  bookingReference,
  rescheduledBy,
  meeting,
}) => {
  const subject = `Booking rescheduled: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>A booking has been rescheduled</h2>
      <p>Hi ${hostDisplayName},</p>
      <p>Your session with <strong>${clientName}</strong> has been rescheduled${
        rescheduledBy === "user" ? " by the client" : ""
      } to:</p>
      <p style="font-size: 18px; font-weight: bold;">${newStartsAt} (${timezone})</p>
      ${meeting ? meetingInfoBlock(meeting) : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = hostBookingRescheduledTemplate;
