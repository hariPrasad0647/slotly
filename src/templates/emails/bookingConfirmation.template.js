
const meetingInfoBlock = require("./meetingInfoBlock");

const bookingConfirmationTemplate = ({
  clientName,
  hostDisplayName,
  startsAt,
  timezone,
  bookingReference,
  meeting,
}) => {
  const subject = `Booking confirmed with ${hostDisplayName}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your booking is confirmed</h2>
      <p>Hi ${clientName},</p>
      <p>Your session with ${hostDisplayName} is confirmed for:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      ${meeting ? meetingInfoBlock(meeting) : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = bookingConfirmationTemplate;
