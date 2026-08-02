
const { formatMoney } = require("../../utils/money.util");

const refundProcessedTemplate = ({
  clientName,
  hostDisplayName,
  bookingReference,
  amount,
  currency,
  reason,
}) => {
  const subject = `Refund issued: ${bookingReference}`;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Your refund has been issued</h2>
      <p>Hi ${clientName},</p>
      <p>A refund of <strong>${formatMoney(amount, currency)}</strong> has been issued for your session with ${hostDisplayName}.${reason ? ` Reason: ${reason}` : ""}</p>
      <p>It may take a few business days to reflect in your original payment method.</p>
      <p>Booking reference: <strong>${bookingReference}</strong></p>
    </div>
  `;

  return { subject, html };
};

module.exports = refundProcessedTemplate;
