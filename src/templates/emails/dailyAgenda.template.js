
const dailyAgendaTemplate = ({ hostDisplayName, bookings }) => {
  const subject = `Your agenda: ${bookings.length} session${bookings.length === 1 ? "" : "s"} in the next 24 hours`;

  const rows = bookings
    .map(
      (booking) => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.timeLabel}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.clientName}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.clientEmail}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${booking.bookingReference}</td>
      </tr>
    `
    )
    .join("");

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2>Your agenda for the next 24 hours</h2>
      <p>Hi ${hostDisplayName},</p>
      <p>Here's what's on your schedule:</p>
      <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
        <thead>
          <tr style="text-align: left;">
            <th style="padding: 8px; border-bottom: 2px solid #333;">Time</th>
            <th style="padding: 8px; border-bottom: 2px solid #333;">Client</th>
            <th style="padding: 8px; border-bottom: 2px solid #333;">Email</th>
            <th style="padding: 8px; border-bottom: 2px solid #333;">Reference</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  return { subject, html };
};

module.exports = dailyAgendaTemplate;
