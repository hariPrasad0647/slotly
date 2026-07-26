
const express = require("express");

const {
  getTutorProfileController,
} = require("../controllers/hostProfile/getTutorProfile.controller");
const {
  updateTutorProfileController,
} = require("../controllers/hostProfile/updateTutorProfile.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");
const validate = require("../middlewares/validate.middleware");

const { updateTutorProfileSchema } = require("../validators/hostProfile.validator");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.get("/", getTutorProfileController);
router.patch("/", validate(updateTutorProfileSchema), updateTutorProfileController);

module.exports = router;
