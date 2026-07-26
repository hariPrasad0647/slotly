
const prisma = require("../../repositories/prisma/prismaClient");

const findHostProfileByUserId = (userId) => {
  return prisma.hostProfile.findUnique({ where: { userId } });
};

const createRule = (data) => {
  return prisma.availabilityRule.create({ data });
};

const findRuleById = (id) => {
  return prisma.availabilityRule.findUnique({ where: { id } });
};

const findRulesByHostProfileId = (hostProfileId) => {
  return prisma.availabilityRule.findMany({
    where: { hostProfileId },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
};

const findActiveRulesForDay = (hostProfileId, dayOfWeek, excludeRuleId) => {
  return prisma.availabilityRule.findMany({
    where: {
      hostProfileId,
      dayOfWeek,
      isActive: true,
      ...(excludeRuleId ? { id: { not: excludeRuleId } } : {}),
    },
  });
};

const updateRule = (id, data) => {
  return prisma.availabilityRule.update({ where: { id }, data });
};

const deleteRule = (id) => {
  return prisma.availabilityRule.delete({ where: { id } });
};

const deleteFutureUnbookedSlotsByRuleId = (ruleId) => {
  return prisma.slot.deleteMany({
    where: {
      availabilityRuleId: ruleId,
      isBooked: false,
      startsAt: { gt: new Date() },
    },
  });
};

module.exports = {
  findHostProfileByUserId,
  createRule,
  findRuleById,
  findRulesByHostProfileId,
  findActiveRulesForDay,
  updateRule,
  deleteRule,
  deleteFutureUnbookedSlotsByRuleId,
};
