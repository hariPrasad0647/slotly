
const { z } = require("zod");

const createBookingSchema = z.object({
  slotId: z.string().min(1, "slotId is required"),
  notes: z.string().trim().max(1000).optional(),
});

const cancelBookingSchema = z.object({
  cancellationReason: z.string().trim().max(500).optional(),
});

const rescheduleBookingSchema = z.object({
  newSlotId: z.string().min(1, "newSlotId is required"),
});

const bookingListQuerySchema = z.object({
  status: z
    .enum(["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED", "NO_SHOW", "RESCHEDULED"])
    .optional(),
  scope: z.enum(["mine", "hosted"]).optional().default("mine"),
});

const slotListQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  isBooked: z
    .enum(["true", "false"])
    .transform((val) => val === "true")
    .optional(),
});

const publicSlotQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  bookingListQuerySchema,
  slotListQuerySchema,
  publicSlotQuerySchema,
};
