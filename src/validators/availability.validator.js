
const { z } = require("zod");

const TIME_REGEX = /^([01]\d|2[0-3]):([0-5]\d)$/;

const isSupportedTimezone = (tz) => {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: tz });
    return true;
  } catch (error) {
    return false;
  }
};

const timezoneSchema = z
  .string()
  .trim()
  .min(1)
  .refine(isSupportedTimezone, "Invalid IANA timezone");

const createRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6),
  startTime: z.string().regex(TIME_REGEX, "startTime must be in HH:mm format"),
  endTime: z.string().regex(TIME_REGEX, "endTime must be in HH:mm format"),
  slotDurationMinutes: z.number().int().min(5).max(480),
  timezone: timezoneSchema,
});

const updateRuleSchema = z.object({
  dayOfWeek: z.number().int().min(0).max(6).optional(),
  startTime: z.string().regex(TIME_REGEX).optional(),
  endTime: z.string().regex(TIME_REGEX).optional(),
  slotDurationMinutes: z.number().int().min(5).max(480).optional(),
  timezone: timezoneSchema.optional(),
  isActive: z.boolean().optional(),
});

const manualSlotSchema = z
  .object({
    startsAt: z.coerce.date(),
    endsAt: z.coerce.date(),
  })
  .refine((slot) => slot.endsAt > slot.startsAt, {
    message: "endsAt must be after startsAt",
    path: ["endsAt"],
  });

const generateSlotsSchema = z
  .object({
    ruleId: z.string().min(1).optional(),
    startDate: z.coerce.date().optional(),
    endDate: z.coerce.date().optional(),
    slots: z.array(manualSlotSchema).min(1).max(100).optional(),
    timezone: timezoneSchema.optional(),
  })
  .refine(
    (data) => Boolean(data.ruleId && data.startDate && data.endDate) !== Boolean(data.slots),
    {
      message:
        "Provide either { ruleId, startDate, endDate } for rule-based generation, or { slots, timezone } for manual slot creation",
    }
  )
  .refine((data) => !data.slots || Boolean(data.timezone), {
    message: "timezone is required when creating manual slots",
    path: ["timezone"],
  })
  .refine(
    (data) => !data.startDate || !data.endDate || data.endDate >= data.startDate,
    { message: "endDate must be on or after startDate", path: ["endDate"] }
  );

const rescheduleSlotSchema = z
  .object({
    newStartsAt: z.coerce.date(),
    newEndsAt: z.coerce.date(),
  })
  .refine((data) => data.newEndsAt > data.newStartsAt, {
    message: "newEndsAt must be after newStartsAt",
    path: ["newEndsAt"],
  });

module.exports = {
  createRuleSchema,
  updateRuleSchema,
  generateSlotsSchema,
  rescheduleSlotSchema,
};
