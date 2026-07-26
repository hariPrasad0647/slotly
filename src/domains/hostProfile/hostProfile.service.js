
const ApiError = require("../../utils/ApiError");
const hostProfileRepository = require("./hostProfile.repository");

const isNonEmptyArray = (value) => Array.isArray(value) && value.length > 0;

const hasSocialLink = (value) =>
  Boolean(value) && Object.values(value).some((link) => Boolean(link));

const COMPLETENESS_CHECKS = [
  { field: "avatarUrl", label: "Profile photo", isFilled: (p) => Boolean(p.avatarUrl) },
  { field: "headline", label: "Headline", isFilled: (p) => Boolean(p.headline) },
  { field: "bio", label: "Bio", isFilled: (p) => Boolean(p.bio) },
  {
    field: "experienceYears",
    label: "Years of experience",
    isFilled: (p) => p.experienceYears !== null && p.experienceYears !== undefined,
  },
  { field: "expertise", label: "Subjects/expertise", isFilled: (p) => isNonEmptyArray(p.expertise) },
  { field: "qualifications", label: "Qualifications", isFilled: (p) => isNonEmptyArray(p.qualifications) },
  { field: "languages", label: "Languages spoken", isFilled: (p) => isNonEmptyArray(p.languages) },
  { field: "socialLinks", label: "Social/website links", isFilled: (p) => hasSocialLink(p.socialLinks) },
];

const calculateCompleteness = (profile) => {
  const completedFields = [];
  const missingFields = [];

  COMPLETENESS_CHECKS.forEach(({ field, label, isFilled }) => {
    if (isFilled(profile)) {
      completedFields.push({ field, label });
    } else {
      missingFields.push({ field, label });
    }
  });

  const percentage = Math.round(
    (completedFields.length / COMPLETENESS_CHECKS.length) * 100
  );

  return {
    percentage,
    isComplete: percentage === 100,
    completedFields,
    missingFields,
  };
};

const getOwnProfile = async (userId) => {
  const profile = await hostProfileRepository.findByUserId(userId);

  if (!profile) {
    throw new ApiError(404, "Host profile not found for this account");
  }

  return { profile, completeness: calculateCompleteness(profile) };
};

const updateOwnProfile = async (userId, input) => {
  const profile = await hostProfileRepository.findByUserId(userId);

  if (!profile) {
    throw new ApiError(404, "Host profile not found for this account");
  }

  const updated = await hostProfileRepository.update(profile.id, input);

  return { profile: updated, completeness: calculateCompleteness(updated) };
};

module.exports = {
  getOwnProfile,
  updateOwnProfile,
  calculateCompleteness,
};
