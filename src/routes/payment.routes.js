
const express = require("express");

const { verifyPaymentController } = require("../controllers/payment/verifyPayment.controller");
const { paymentHistoryController } = require("../controllers/payment/paymentHistory.controller");
const { paymentReceiptController } = require("../controllers/payment/paymentReceipt.controller");
const { refundPaymentController } = require("../controllers/payment/refundPayment.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  verifyPaymentSchema,
  paymentHistoryQuerySchema,
  refundPaymentSchema,
} = require("../validators/payment.validator");

const router = express.Router();

router.use(authMiddleware);

router.post("/verify", validate(verifyPaymentSchema), verifyPaymentController);
router.get("/history", validate(paymentHistoryQuerySchema, "query"), paymentHistoryController);
router.get("/:paymentId/receipt", paymentReceiptController);
router.post(
  "/:paymentId/refund",
  adminMiddleware,
  validate(refundPaymentSchema),
  refundPaymentController
);

module.exports = router;
