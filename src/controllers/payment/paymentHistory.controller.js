
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const paymentService = require("../../domains/payment/payment.service");

const paymentHistoryController = asyncHandler(async (req, res) => {
  const history = await paymentService.getPaymentHistory(req.user, req.query);

  return res
    .status(200)
    .json(new ApiResponse(200, "Payment history fetched successfully", history));
});

module.exports = {
  paymentHistoryController,
};
