
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const couponService = require("../../domains/coupon/coupon.service");

const createCouponController = asyncHandler(async (req, res) => {
  const coupon = await couponService.createCoupon(req.user.id, req.body);

  return res.status(201).json(new ApiResponse(201, "Coupon created successfully", coupon));
});

module.exports = {
  createCouponController,
};
