
const axios = require("axios");

const zoomConfig = require("../../config/zoom");
const zoomTokenService = require("./zoomToken.service");

const authHeaders = async () => {
  const accessToken = await zoomTokenService.getAccessToken();
  return { Authorization: `Bearer ${accessToken}` };
};

const createMeeting = async ({ topic, agenda, startTime, durationMinutes, timezone }) => {
  const headers = await authHeaders();

  const response = await axios.post(
    `${zoomConfig.API_BASE_URL}/users/me/meetings`,
    {
      topic,
      agenda,
      type: 2,
      start_time: startTime.toISOString(),
      duration: durationMinutes,
      timezone,
      settings: {
        join_before_host: true,
        waiting_room: false,
        host_video: true,
        participant_video: true,
      },
    },
    { headers }
  );

  return response.data;
};

const updateMeeting = async (meetingId, { startTime, durationMinutes }) => {
  const headers = await authHeaders();

  await axios.patch(
    `${zoomConfig.API_BASE_URL}/meetings/${meetingId}`,
    {
      start_time: startTime.toISOString(),
      duration: durationMinutes,
    },
    { headers }
  );
};

const deleteMeeting = async (meetingId) => {
  const headers = await authHeaders();

  await axios.delete(`${zoomConfig.API_BASE_URL}/meetings/${meetingId}`, {
    headers,
  });
};

module.exports = {
  createMeeting,
  updateMeeting,
  deleteMeeting,
};
