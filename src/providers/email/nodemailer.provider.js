
const transporter = require("../../config/mail");
const env = require("../../config/env");
const logger = require("../../config/logger");

const sendEmail = async ({ to, subject, html }) => {
  try {
    await transporter.sendMail({
      from: env.SMTP_FROM,
      to,
      subject,
      html,
    });
  } catch (error) {
    logger.error(
      {
        err: error,
        to,
        subject,
      },
      "Failed to send email"
    );

    throw error;
  }
};

module.exports = {
  sendEmail,
};
