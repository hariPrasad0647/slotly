
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezonePlugin = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezonePlugin);

const prisma = require("../../repositories/prisma/prismaClient");
const ApiError = require("../../utils/ApiError");
const { hasOverlappingSlot } = require("./bookingConflict.service");

const MAX_GENERATION_DAYS = 60;

const buildDateTimeInTz = (dateStr, timeStr, tz) => {
  return dayjs.tz(`${dateStr} ${timeStr}`, tz).toDate();
};

const createSlotIfFree = async ({ hostProfileId, availabilityRuleId, startsAt, endsAt, timezone, bufferMinutes }) => {
  const overlaps = await hasOverlappingSlot({
    hostProfileId,
    startsAt,
    endsAt,
    bufferMinutes,
  });

  if (overlaps) {
    return { status: "skipped", reason: "overlap", startsAt, endsAt };
  }

  try {
    const slot = await prisma.slot.create({
      data: {
        hostProfileId,
        availabilityRuleId: availabilityRuleId || null,
        startsAt,
        endsAt,
        timezone,
      },
    });

    return { status: "created", slot };
  } catch (error) {
    if (error.code === "P2002") {
      return { status: "skipped", reason: "duplicate", startsAt, endsAt };
    }

    throw error;
  }
};

const generateSlotsFromRule = async ({ hostProfile, rule, startDate, endDate }) => {
  const start = dayjs(startDate).startOf("day");
  const end = dayjs(endDate).startOf("day");

  if (end.diff(start, "day") > MAX_GENERATION_DAYS) {
    throw new ApiError(
      422,
      `Cannot generate slots for more than ${MAX_GENERATION_DAYS} days at a time`
    );
  }

  const bufferMinutes = hostProfile.meetingBufferMinutes || 0;
  const created = [];
  const skipped = [];
  const now = new Date();

  for (let cursor = start; cursor.isBefore(end) || cursor.isSame(end); cursor = cursor.add(1, "day")) {
    if (cursor.day() !== rule.dayOfWeek) {
      continue;
    }

    const dateStr = cursor.format("YYYY-MM-DD");
    const rangeStart = buildDateTimeInTz(dateStr, rule.startTime, rule.timezone);
    const rangeEnd = buildDateTimeInTz(dateStr, rule.endTime, rule.timezone);

    let slotStart = rangeStart;

    while (slotStart.getTime() + rule.slotDurationMinutes * 60000 <= rangeEnd.getTime()) {
      const slotEnd = new Date(slotStart.getTime() + rule.slotDurationMinutes * 60000);

      if (slotStart > now) {
        const result = await createSlotIfFree({
          hostProfileId: hostProfile.id,
          availabilityRuleId: rule.id,
          startsAt: slotStart,
          endsAt: slotEnd,
          timezone: rule.timezone,
          bufferMinutes,
        });

        if (result.status === "created") {
          created.push(result.slot);
        } else {
          skipped.push(result);
        }
      }

      slotStart = new Date(slotEnd.getTime() + bufferMinutes * 60000);
    }
  }

  return { created, skipped };
};

const generateManualSlots = async ({ hostProfile, slots, timezone }) => {
  const created = [];
  const skipped = [];
  const now = new Date();
  const bufferMinutes = hostProfile.meetingBufferMinutes || 0;

  for (const { startsAt, endsAt } of slots) {
    if (startsAt <= now) {
      skipped.push({ startsAt, endsAt, reason: "in the past" });
      continue;
    }

    const result = await createSlotIfFree({
      hostProfileId: hostProfile.id,
      availabilityRuleId: null,
      startsAt,
      endsAt,
      timezone,
      bufferMinutes,
    });

    if (result.status === "created") {
      created.push(result.slot);
    } else {
      skipped.push(result);
    }
  }

  return { created, skipped };
};

module.exports = {
  generateSlotsFromRule,
  generateManualSlots,
};
