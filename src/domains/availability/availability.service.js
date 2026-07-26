
const ApiError = require("../../utils/ApiError");
const availabilityRepository = require("./availability.repository");
const { assertRuleOwnership } = require("./availability.policy");

const timeToMinutes = (time) => {
  const [hours, minutes] = time.split(":").map(Number);
  return hours * 60 + minutes;
};

const rangesOverlap = (aStart, aEnd, bStart, bEnd) => aStart < bEnd && bStart < aEnd;

const getOwnHostProfile = async (userId) => {
  const hostProfile = await availabilityRepository.findHostProfileByUserId(userId);

  if (!hostProfile) {
    throw new ApiError(404, "Host profile not found for this account");
  }

  return hostProfile;
};

const assertValidTimeRange = ({ startTime, endTime, slotDurationMinutes }) => {
  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);

  if (endMinutes <= startMinutes) {
    throw new ApiError(422, "endTime must be after startTime");
  }

  if (endMinutes - startMinutes < slotDurationMinutes) {
    throw new ApiError(
      422,
      "The time range must fit at least one slot of the given duration"
    );
  }
};

const assertNoRuleOverlap = async (hostProfileId, rule, excludeRuleId) => {
  const startMinutes = timeToMinutes(rule.startTime);
  const endMinutes = timeToMinutes(rule.endTime);

  const rulesSameDay = await availabilityRepository.findActiveRulesForDay(
    hostProfileId,
    rule.dayOfWeek,
    excludeRuleId
  );

  const hasOverlap = rulesSameDay.some((existingRule) =>
    rangesOverlap(
      startMinutes,
      endMinutes,
      timeToMinutes(existingRule.startTime),
      timeToMinutes(existingRule.endTime)
    )
  );

  if (hasOverlap) {
    throw new ApiError(
      409,
      "This availability rule overlaps with an existing rule for the same day"
    );
  }
};

const createRule = async (userId, input) => {
  const hostProfile = await getOwnHostProfile(userId);

  assertValidTimeRange(input);
  await assertNoRuleOverlap(hostProfile.id, input);

  return availabilityRepository.createRule({
    hostProfileId: hostProfile.id,
    dayOfWeek: input.dayOfWeek,
    startTime: input.startTime,
    endTime: input.endTime,
    slotDurationMinutes: input.slotDurationMinutes,
    timezone: input.timezone,
  });
};

const listRules = async (userId) => {
  const hostProfile = await getOwnHostProfile(userId);

  return availabilityRepository.findRulesByHostProfileId(hostProfile.id);
};

const updateRule = async (userId, ruleId, input) => {
  const hostProfile = await getOwnHostProfile(userId);
  const rule = await availabilityRepository.findRuleById(ruleId);

  assertRuleOwnership(rule, hostProfile.id);

  const merged = {
    dayOfWeek: input.dayOfWeek ?? rule.dayOfWeek,
    startTime: input.startTime ?? rule.startTime,
    endTime: input.endTime ?? rule.endTime,
    slotDurationMinutes: input.slotDurationMinutes ?? rule.slotDurationMinutes,
    timezone: input.timezone ?? rule.timezone,
  };

  assertValidTimeRange(merged);

  const resultingIsActive =
    input.isActive !== undefined ? input.isActive : rule.isActive;

  if (resultingIsActive) {
    await assertNoRuleOverlap(hostProfile.id, merged, ruleId);
  }

  return availabilityRepository.updateRule(ruleId, {
    ...merged,
    isActive: resultingIsActive,
  });
};

const deleteRule = async (userId, ruleId) => {
  const hostProfile = await getOwnHostProfile(userId);
  const rule = await availabilityRepository.findRuleById(ruleId);

  assertRuleOwnership(rule, hostProfile.id);

  await availabilityRepository.deleteFutureUnbookedSlotsByRuleId(ruleId);
  await availabilityRepository.deleteRule(ruleId);
};

module.exports = {
  getOwnHostProfile,
  createRule,
  listRules,
  updateRule,
  deleteRule,
};
