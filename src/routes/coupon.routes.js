
const express = require("express");

const { createCouponController } = require("../controllers/coupon/createCoupon.controller");
const { listCouponsController } = require("../controllers/coupon/listCoupons.controller");
const { updateCouponController } = require("../controllers/coupon/updateCoupon.controller");
const { deleteCouponController } = require("../controllers/coupon/deleteCoupon.controller");

const authMiddleware = require("../middlewares/auth.middleware");
const { adminMiddleware } = require("../middlewares/admin.middleware");
const validate = require("../middlewares/validate.middleware");

const {
  createCouponSchema,
  updateCouponSchema,
  couponListQuerySchema,
} = require("../validators/coupon.validator");

const router = express.Router();

router.use(authMiddleware, adminMiddleware);

router.post("/", validate(createCouponSchema), createCouponController);
router.get("/", validate(couponListQuerySchema, "query"), listCouponsController);
router.patch("/:couponId", validate(updateCouponSchema), updateCouponController);
router.delete("/:couponId", deleteCouponController);

module.exports = router;
