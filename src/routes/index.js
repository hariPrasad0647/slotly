
const express = require("express");

const healthRoutes = require("./health.routes");
const authRoutes = require("./auth.routes");
const availabilityRoutes = require("./availability.routes");
const bookingRoutes = require("./booking.routes");
const hostProfileRoutes = require("./hostProfile.routes");
const paymentRoutes = require("./payment.routes");
const webhookRoutes = require("./webhook.routes");
const analyticsRoutes = require("./analytics.routes");
const couponRoutes = require("./coupon.routes");

const router = express.Router();

router.use("/health", healthRoutes);
router.use("/auth", authRoutes);
router.use("/availability", availabilityRoutes);
router.use("/bookings", bookingRoutes);
router.use("/tutor-profile", hostProfileRoutes);
router.use("/payments", paymentRoutes);
router.use("/webhooks", webhookRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/coupons", couponRoutes);

module.exports = router;

