
const express = require("express");

const {
  getPublicHostProfileController,
  getPublicSlotsController,
} = require("../controllers/booking/publicBooking.controller");
const { createBookingController } = require("../controllers/booking/createBooking.controller");
const { getBookingsController } = require("../controllers/booking/getBookings.controller");
const {
  bookingDetailsController,
} = require("../controllers/booking/bookingDetails.controller");
const { cancelBookingController } = require("../controllers/booking/cancelBooking.controller");
const {
  rescheduleBookingController,
} = require("../controllers/booking/rescheduleBooking.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  createBookingSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  bookingListQuerySchema,
  publicSlotQuerySchema,
} = require("../validators/booking.validator");

const router = express.Router();

router.get(
  "/public/:username",
  getPublicHostProfileController
);

router.get(
  "/public/:username/slots",
  validate(publicSlotQuerySchema, "query"),
  getPublicSlotsController
);

router.use(authMiddleware);

router.post("/", validate(createBookingSchema), createBookingController);
router.get("/", validate(bookingListQuerySchema, "query"), getBookingsController);
router.get("/:bookingId", bookingDetailsController);
router.post("/:bookingId/cancel", validate(cancelBookingSchema), cancelBookingController);
router.post(
  "/:bookingId/reschedule",
  validate(rescheduleBookingSchema),
  rescheduleBookingController
);

module.exports = router;
