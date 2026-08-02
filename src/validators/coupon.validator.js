
const { z } = require("zod");

const CODE_REGEX = /^[A-Z0-9_-]{3,30}$/;

const codeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(CODE_REGEX, "Code must be 3-30 characters: letters, numbers, hyphens or underscores");

const pricingRefinement = (data) =>
  data.discountType !== "PERCENTAGE" || (data.discountValue >= 1 && data.discountValue <= 100);
const pricingRefinementMessage = {
  message: "Percentage discounts must be between 1 and 100",
  path: ["discountValue"],
};

const createCouponSchema = z
  .object({
    code: codeSchema,
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(["PERCENTAGE", "FLAT"]),
    discountValue: z.number().int().min(1),
    minAmount: z.number().int().min(0).optional().default(0),
    maxRedemptions: z.number().int().min(1).optional(),
    validFrom: z.coerce.date().optional(),
    validUntil: z.coerce.date().optional(),
    isActive: z.boolean().optional().default(true),
  })
  .refine(pricingRefinement, pricingRefinementMessage)
  .refine((data) => !data.validFrom || !data.validUntil || data.validUntil > data.validFrom, {
    message: "validUntil must be after validFrom",
    path: ["validUntil"],
  });

const updateCouponSchema = z
  .object({
    description: z.string().trim().max(500).optional(),
    discountType: z.enum(["PERCENTAGE", "FLAT"]).optional(),
    discountValue: z.number().int().min(1).optional(),
    minAmount: z.number().int().min(0).optional(),
    maxRedemptions: z.number().int().min(1).nullable().optional(),
    validFrom: z.coerce.date().nullable().optional(),
    validUntil: z.coerce.date().nullable().optional(),
    isActive: z.boolean().optional(),
  })
  .refine(
    (data) =>
      data.discountType !== "PERCENTAGE" ||
      data.discountValue === undefined ||
      (data.discountValue >= 1 && data.discountValue <= 100),
    pricingRefinementMessage
  );

const couponListQuerySchema = z.object({
  isActive: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

module.exports = {
  createCouponSchema,
  updateCouponSchema,
  couponListQuerySchema,
};
