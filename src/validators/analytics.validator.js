
const { z } = require("zod");

const dateRangeQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
});

const revenueTrendQuerySchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  granularity: z.enum(["day", "week", "month"]).optional().default("day"),
});

const monthlyGrowthQuerySchema = z.object({
  months: z.coerce.number().int().min(2).max(24).optional().default(6),
});

module.exports = {
  dateRangeQuerySchema,
  revenueTrendQuerySchema,
  monthlyGrowthQuerySchema,
};
