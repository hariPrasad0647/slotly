
const passwordResetOtpTemplate = ({ firstName, otp, expiryMinutes }) => {
  const subject = "Your Slotly password reset code";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Reset your password</h2>
      <p>Hi ${firstName},</p>
      <p>Use the code below to reset your Slotly password. This code expires in ${expiryMinutes} minutes.</p>
      <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px;">${otp}</p>
      <p>If you didn't request this, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, html };
};

module.exports = passwordResetOtpTemplate;
