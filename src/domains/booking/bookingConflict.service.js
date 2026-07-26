
const prisma = require("../../repositories/prisma/prismaClient");

const hasOverlappingSlot = async ({
  hostProfileId,
  startsAt,
  endsAt,
  excludeSlotId,
  bufferMinutes = 0,
}) => {
  const bufferMs = bufferMinutes * 60 * 1000;
  const bufferedStart = new Date(startsAt.getTime() - bufferMs);
  const bufferedEnd = new Date(endsAt.getTime() + bufferMs);

  const conflicting = await prisma.slot.findFirst({
    where: {
      hostProfileId,
      ...(excludeSlotId ? { id: { not: excludeSlotId } } : {}),
      startsAt: { lt: bufferedEnd },
      endsAt: { gt: bufferedStart },
    },
    select: { id: true },
  });

  return Boolean(conflicting);
};

module.exports = {
  hasOverlappingSlot,
};
