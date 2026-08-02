
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const couponService = require("../../domains/coupon/coupon.service");

const deleteCouponController = asyncHandler(async (req, res) => {
  await couponService.deleteCoupon(req.user.id, req.params.couponId);

  return res.status(200).json(new ApiResponse(200, "Coupon deleted successfully", null));
});

module.exports = {
  deleteCouponController,
};
