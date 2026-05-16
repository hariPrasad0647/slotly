
const ApiResponse = require("../../utils/ApiResponse");

const healthController = async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, "Server is running", {
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
    })
  );
};

module.exports = {
  healthController,
};

