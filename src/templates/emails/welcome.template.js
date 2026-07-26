
const welcomeTemplate = ({ firstName }) => {
  const subject = "Welcome to Slotly";

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto;">
      <h2>Welcome to Slotly, ${firstName}!</h2>
      <p>Your account has been created successfully. You can now log in and start scheduling.</p>
    </div>
  `;

  return { subject, html };
};

module.exports = welcomeTemplate;
