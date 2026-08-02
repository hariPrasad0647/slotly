
const asyncHandler = require("../../utils/asyncHandler");
const paymentService = require("../../domains/payment/payment.service");

const paymentReceiptController = asyncHandler(async (req, res) => {
  const { filename, pdf } = await paymentService.getPaymentReceipt(req.user, req.params.paymentId);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);

  return res.status(200).send(pdf);
});

module.exports = {
  paymentReceiptController,
};
