
const { formatMoney } = require("../../utils/money.util");

const failedPaymentTemplate = ({
  clientName,
  hostDisplayName,
  startsAt,
  timezone,
  bookingReference,
  amount,
  currency,
  reason,
}) => {
  const subject = `Payment failed for your booking: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your payment could not be completed</h2>
      <p>Hi ${clientName},</p>
      <p>We were unable to process your payment of <strong>${formatMoney(amount, currency)}</strong> for your session with ${hostDisplayName}, originally scheduled for:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      <p>${reason ? `Reason: ${reason}. ` : ""}The slot has been released so you're welcome to try booking again.</p>
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = failedPaymentTemplate;
