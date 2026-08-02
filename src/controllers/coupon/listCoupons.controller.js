
const asyncHandler = require("../../utils/asyncHandler");
const ApiResponse = require("../../utils/ApiResponse");
const couponService = require("../../domains/coupon/coupon.service");

const listCouponsController = asyncHandler(async (req, res) => {
  const coupons = await couponService.listCoupons(req.user.id, req.query);

  return res.status(200).json(new ApiResponse(200, "Coupons fetched successfully", coupons));
});

module.exports = {
  listCouponsController,
};
