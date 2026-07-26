
const axios = require("axios");

const zoomConfig = require("../../config/zoom");
const ApiError = require("../../utils/ApiError");

const TOKEN_REFRESH_BUFFER_MS = 60 * 1000;

let cachedToken = null;
let cachedExpiresAt = 0;

const fetchAccessToken = async () => {
  const basicAuth = Buffer.from(
    `${zoomConfig.CLIENT_ID}:${zoomConfig.CLIENT_SECRET}`
  ).toString("base64");

  const response = await axios.post(zoomConfig.OAUTH_TOKEN_URL, null, {
    params: {
      grant_type: "account_credentials",
      account_id: zoomConfig.ACCOUNT_ID,
    },
    headers: {
      Authorization: `Basic ${basicAuth}`,
    },
  });

  return response.data;
};

const getAccessToken = async () => {
  if (!zoomConfig.isConfigured) {
    throw new ApiError(500, "Zoom integration is not configured");
  }

  const now = Date.now();

  if (cachedToken && now < cachedExpiresAt - TOKEN_REFRESH_BUFFER_MS) {
    return cachedToken;
  }

  const { access_token: accessToken, expires_in: expiresIn } =
    await fetchAccessToken();

  cachedToken = accessToken;
  cachedExpiresAt = now + expiresIn * 1000;

  return cachedToken;
};

module.exports = {
  getAccessToken,
};
