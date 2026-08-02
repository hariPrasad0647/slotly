
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const couponService = require("../../domains/coupon/coupon.service");

const updateCouponController = asyncHandler(async (req, res) => {
  const coupon = await couponService.updateCoupon(req.user.id, req.params.couponId, req.body);

  return res.status(200).json(new ApiResponse(200, "Coupon updated successfully", coupon));
});

module.exports = {
  updateCouponController,
};
