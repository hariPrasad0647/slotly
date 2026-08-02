
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const refundService = require("../../domains/payment/refund.service");

const refundPaymentController = asyncHandler(async (req, res) => {
  const refund = await refundService.createRefund(req.user.id, req.params.paymentId, req.body);

  return res.status(201).json(new ApiResponse(201, "Refund initiated successfully", refund));
});

module.exports = {
  refundPaymentController,
};
