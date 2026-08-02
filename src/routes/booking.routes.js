
const express = require("express");

const {
  getPublicHostProfileController,
  getPublicSlotsController,
  getPublicSessionTypesController,
  trackProfileViewController,
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
const { completeBookingController } = require("../controllers/booking/completeBooking.controller");
const { markNoShowController } = require("../controllers/booking/markNoShow.controller");
const { exportBookingsController } = require("../controllers/booking/exportBookings.controller");
const {
  downloadIcsController,
  googleCalendarLinkController,
} = require("../controllers/booking/bookingCalendar.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  createBookingSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  bookingListQuerySchema,
  publicSlotQuerySchema,
  noShowSchema,
  trackVisitSchema,
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

router.get(
  "/public/:username/session-types",
  getPublicSessionTypesController
);

router.post(
  "/public/:username/view",
  validate(trackVisitSchema),
  trackProfileViewController
);

router.use(authMiddleware);

router.post("/", validate(createBookingSchema), createBookingController);
router.get("/", validate(bookingListQuerySchema, "query"), getBookingsController);
router.get("/export", validate(bookingListQuerySchema, "query"), exportBookingsController);
router.get("/:bookingId", bookingDetailsController);
router.get("/:bookingId/calendar.ics", downloadIcsController);
router.get("/:bookingId/calendar/google", googleCalendarLinkController);
router.post("/:bookingId/cancel", validate(cancelBookingSchema), cancelBookingController);
router.post(
  "/:bookingId/reschedule",
  validate(rescheduleBookingSchema),
  rescheduleBookingController
);
router.post("/:bookingId/complete", completeBookingController);
router.post("/:bookingId/no-show", validate(noShowSchema), markNoShowController);

module.exports = router;
