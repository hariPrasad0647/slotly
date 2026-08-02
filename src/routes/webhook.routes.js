
const express = require("express");

const { razorpayWebhookController } = require("../controllers/webhook/razorpayWebhook.controller");
const { verifyRazorpaySignature } = require("../middlewares/webhookSignature.middleware");

const router = express.Router();

router.post("/razorpay", verifyRazorpaySignature, razorpayWebhookController);

module.exports = router;
