
const ApiError = require("../../utils/ApiError");
const availabilityService = require("../availability/availability.service");
const couponRepository = require("./coupon.repository");

const assertCouponOwnership = (coupon, hostProfileId) => {
  if (!coupon || coupon.hostProfileId !== hostProfileId) {
    throw new ApiError(404, "Coupon not found");
  }
};

const createCoupon = async (userId, input) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  const existing = await couponRepository.findByHostAndCode(hostProfile.id, input.code);

  if (existing) {
    throw new ApiError(409, "A coupon with this code already exists");
  }

  return couponRepository.create({
    hostProfileId: hostProfile.id,
    code: input.code,
    description: input.description,
    discountType: input.discountType,
    discountValue: input.discountValue,
    minAmount: input.minAmount,
    maxRedemptions: input.maxRedemptions,
    validFrom: input.validFrom,
    validUntil: input.validUntil,
    isActive: input.isActive,
  });
};

const listCoupons = async (userId, filters) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);

  return couponRepository.findByHostProfileId(hostProfile.id, filters);
};

const updateCoupon = async (userId, couponId, input) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);
  const coupon = await couponRepository.findById(couponId);

  assertCouponOwnership(coupon, hostProfile.id);

  const resultingDiscountType = input.discountType ?? coupon.discountType;
  const resultingDiscountValue = input.discountValue ?? coupon.discountValue;

  if (
    resultingDiscountType === "PERCENTAGE" &&
    (resultingDiscountValue < 1 || resultingDiscountValue > 100)
  ) {
    throw new ApiError(422, "Percentage discounts must be between 1 and 100");
  }

  return couponRepository.update(couponId, {
    ...input,
    discountType: resultingDiscountType,
    discountValue: resultingDiscountValue,
  });
};

const deleteCoupon = async (userId, couponId) => {
  const hostProfile = await availabilityService.getOwnHostProfile(userId);
  const coupon = await couponRepository.findById(couponId);

  assertCouponOwnership(coupon, hostProfile.id);

  await couponRepository.deleteById(couponId);
};

const computeDiscount = (coupon, amount) => {
  if (coupon.discountType === "PERCENTAGE") {
    return Math.floor((amount * coupon.discountValue) / 100);
  }

  return Math.min(coupon.discountValue, amount);
};

const validateCouponForBooking = async (hostProfileId, code, amount) => {
  const coupon = await couponRepository.findByHostAndCode(hostProfileId, code.trim().toUpperCase());

  if (!coupon) {
    throw new ApiError(404, "Invalid coupon code");
  }

  if (!coupon.isActive) {
    throw new ApiError(400, "This coupon is no longer active");
  }

  const now = new Date();

  if (coupon.validFrom && now < coupon.validFrom) {
    throw new ApiError(400, "This coupon is not valid yet");
  }

  if (coupon.validUntil && now > coupon.validUntil) {
    throw new ApiError(400, "This coupon has expired");
  }

  if (coupon.maxRedemptions !== null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    throw new ApiError(409, "This coupon has reached its redemption limit");
  }

  if (amount < coupon.minAmount) {
    throw new ApiError(422, `This coupon requires a minimum booking amount of ${coupon.minAmount}`);
  }

  const discountAmount = computeDiscount(coupon, amount);

  return { coupon, discountAmount, finalAmount: Math.max(amount - discountAmount, 0) };
};

module.exports = {
  createCoupon,
  listCoupons,
  updateCoupon,
  deleteCoupon,
  validateCouponForBooking,
};
