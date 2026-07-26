
const express = require("express");

const {
  createAvailabilityController,
} = require("../controllers/availability/createAvailability.controller");
const {
  getAvailabilityController,
} = require("../controllers/availability/getAvailability.controller");
const {
  updateAvailabilityController,
} = require("../controllers/availability/updateAvailability.controller");
const {
  deleteAvailabilityController,
  deleteSlotController,
} = require("../controllers/availability/deleteAvailability.controller");
const {
  generateSlotsController,
} = require("../controllers/availability/generateSlots.controller");
const {
  rescheduleSlotController,
} = require("../controllers/availability/rescheduleSlot.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  createRuleSchema,
  updateRuleSchema,
  generateSlotsSchema,
  rescheduleSlotSchema,
} = require("../validators/availability.validator");
const { slotListQuerySchema } = require("../validators/booking.validator");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", validate(slotListQuerySchema, "query"), getAvailabilityController);

router.post("/rules", validate(createRuleSchema), createAvailabilityController);
router.patch("/rules/:ruleId", validate(updateRuleSchema), updateAvailabilityController);
router.delete("/rules/:ruleId", deleteAvailabilityController);

router.post("/slots/generate", validate(generateSlotsSchema), generateSlotsController);
router.patch("/slots/:slotId", validate(rescheduleSlotSchema), rescheduleSlotController);
router.delete("/slots/:slotId", deleteSlotController);

module.exports = router;
