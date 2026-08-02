
const { z } = require("zod");

const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string().min(1, "razorpayOrderId is required"),
  razorpayPaymentId: z.string().min(1, "razorpayPaymentId is required"),
  razorpaySignature: z.string().min(1, "razorpaySignature is required"),
});

const paymentHistoryQuerySchema = z.object({
  status: z.enum(["PENDING", "PAID", "FAILED", "REFUNDED"]).optional(),
  scope: z.enum(["mine", "hosted"]).optional().default("mine"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const refundPaymentSchema = z.object({
  amount: z.number().int().min(1).optional(),
  reason: z.string().trim().max(500).optional(),
});

module.exports = {
  verifyPaymentSchema,
  paymentHistoryQuerySchema,
  refundPaymentSchema,
};
