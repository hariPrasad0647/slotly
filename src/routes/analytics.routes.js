
const express = require("express");

const {
  getDashboardSummaryController,
} = require("../controllers/analytics/dashboardAnalytics.controller");
const {
  getBookingsByDayController,
  getTopBookingDaysController,
  getPopularSlotsController,
  getPeakBookingHoursController,
} = require("../controllers/analytics/bookingAnalytics.controller");
const {
  getRevenueTrendController,
  getMonthlyGrowthController,
} = require("../controllers/analytics/revenueAnalytics.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  dateRangeQuerySchema,
  revenueTrendQuerySchema,
  monthlyGrowthQuerySchema,
} = require("../validators/analytics.validator");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/dashboard", validate(dateRangeQuerySchema, "query"), getDashboardSummaryController);
router.get(
  "/charts/bookings-by-day",
  validate(dateRangeQuerySchema, "query"),
  getBookingsByDayController
);
router.get(
  "/charts/top-booking-days",
  validate(dateRangeQuerySchema, "query"),
  getTopBookingDaysController
);
router.get(
  "/charts/popular-slots",
  validate(dateRangeQuerySchema, "query"),
  getPopularSlotsController
);
router.get(
  "/charts/peak-hours",
  validate(dateRangeQuerySchema, "query"),
  getPeakBookingHoursController
);
router.get(
  "/charts/revenue-trend",
  validate(revenueTrendQuerySchema, "query"),
  getRevenueTrendController
);
router.get(
  "/charts/monthly-growth",
  validate(monthlyGrowthQuerySchema, "query"),
  getMonthlyGrowthController
);

module.exports = router;
