
const env = require("./env");

module.exports = {
  CLIENT_ID: env.ZOOM_CLIENT_ID,
  CLIENT_SECRET: env.ZOOM_CLIENT_SECRET,
  ACCOUNT_ID: env.ZOOM_ACCOUNT_ID,
  OAUTH_TOKEN_URL: "https://zoom.us/oauth/token",
  API_BASE_URL: "https://api.zoom.us/v2",
  isConfigured: Boolean(env.ZOOM_CLIENT_ID && env.ZOOM_CLIENT_SECRET && env.ZOOM_ACCOUNT_ID),
};
