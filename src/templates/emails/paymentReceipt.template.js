
const { formatMoney } = require("../../utils/money.util");

const paymentReceiptTemplate = ({
  clientName,
  hostDisplayName,
  startsAt,
  timezone,
  bookingReference,
  amount,
  currency,
  discountAmount,
  couponCode,
}) => {
  const subject = `Payment received: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Payment received</h2>
      <p>Hi ${clientName},</p>
      <p>We've received your payment of <strong>${formatMoney(amount, currency)}</strong> for your session with ${hostDisplayName}:</p>
      <p style="font-size: 18px; font-weight: bold;">${startsAt} (${timezone})</p>
      ${
        discountAmount > 0
          ? `<p>Coupon <strong>${couponCode}</strong> applied: -${formatMoney(discountAmount, currency)}</p>`
          : ""
      }
      <p>Booking reference: <strong>${bookingReference}</strong></p>
      <p>You can download a detailed receipt any time from your bookings page.</p>
    </div>
  `;

  return { subject, html };
};

module.exports = paymentReceiptTemplate;
