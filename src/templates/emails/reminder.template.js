
const meetingInfoBlock = require("./meetingInfoBlock");

const reminderTemplate = ({
  clientName,
  hostDisplayName,
  startsAt,
  timezone,
  bookingReference,
  hoursBefore,
  meeting,
}) => {
  const whenLabel = hoursBefore >= 24 ? "tomorrow" : `in ${hoursBefore} hour${hoursBefore === 1 ? "" : "s"}`;
  const subject = `Reminder: your session with ${hostDisplayName} is ${whenLabel}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Upcoming session reminder</h2>
      <p>Hi ${clientName},</p>
      <p>This is a reminder that your session with ${hostDisplayName} is coming up:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      ${meeting ? meetingInfoBlock(meeting) : ""}
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = reminderTemplate;
