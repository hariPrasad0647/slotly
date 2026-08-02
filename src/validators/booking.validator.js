
const { z } = require("zod");
const { isSupportedTimezone } = require("../utils/timezone.util");

const createBookingSchema = z.object({
  slotId: z.string().min(1, "slotId is required"),
  notes: z.string().trim().max(1000).optional(),
  couponCode: z.string().trim().min(1).max(30).optional(),
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
  timeframe: z.enum(["upcoming", "past", "all"]).optional().default("all"),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  search: z.string().trim().max(200).optional(),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).optional().default(20),
});

const noShowSchema = z.object({
  reason: z.string().trim().max(500).optional(),
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
  ruleId: z.string().min(1).optional(),
  durationMinutes: z.coerce.number().int().min(5).max(480).optional(),
  viewerTimezone: z
    .string()
    .trim()
    .min(1)
    .refine(isSupportedTimezone, "Invalid IANA timezone")
    .optional(),
});

const trackVisitSchema = z.object({
  visitorId: z.string().trim().min(1).max(100).optional(),
  referrer: z.string().trim().max(500).optional(),
});

module.exports = {
  createBookingSchema,
  cancelBookingSchema,
  rescheduleBookingSchema,
  bookingListQuerySchema,
  slotListQuerySchema,
  publicSlotQuerySchema,
  noShowSchema,
  trackVisitSchema,
};
