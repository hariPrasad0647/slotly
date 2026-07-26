
const meetingInfoBlock = ({ joinUrl, meetingId, password, startUrl }) => {
  if (!joinUrl) {
    return "";
  }

  return `
    <div style="background: #f4f6f8; border-radius: 8px; padding: 16px; margin: 16px 0;">
      <p style="margin: 0 0 8px;"><strong>Zoom Meeting</strong></p>
      ${startUrl ? `<p style="margin: 4px 0;">Start as host: <a href="${startUrl}">${startUrl}</a></p>` : ""}
      <p style="margin: 4px 0;">Join link: <a href="${joinUrl}">${joinUrl}</a></p>
      ${meetingId ? `<p style="margin: 4px 0;">Meeting ID: <strong>${meetingId}</strong></p>` : ""}
      ${password ? `<p style="margin: 4px 0;">Passcode: <strong>${password}</strong></p>` : ""}
    </div>
  `;
};

module.exports = meetingInfoBlock;
