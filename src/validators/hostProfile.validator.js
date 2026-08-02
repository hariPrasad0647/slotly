
const { z } = require("zod");
const { isSupportedTimezone } = require("../utils/timezone.util");

const socialLinksSchema = z
  .object({
    website: z.string().trim().url().optional(),
    linkedin: z.string().trim().url().optional(),
    twitter: z.string().trim().url().optional(),
    instagram: z.string().trim().url().optional(),
    youtube: z.string().trim().url().optional(),
  })
  .partial();

const faqSchema = z.object({
  question: z.string().trim().min(1).max(300),
  answer: z.string().trim().min(1).max(2000),
});

const updateTutorProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(150).optional(),
  headline: z.string().trim().min(1).max(150).optional(),
  bio: z.string().trim().min(1).max(2000).optional(),
  avatarUrl: z.string().trim().url().optional(),
  companyLogoUrl: z.string().trim().url().optional(),
  bannerUrl: z.string().trim().url().optional(),
  timezone: z.string().trim().min(1).refine(isSupportedTimezone, "Invalid IANA timezone").optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  expertise: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  qualifications: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  languages: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  socialLinks: socialLinksSchema.optional(),
  faqs: z.array(faqSchema).max(30).optional(),
  isPublic: z.boolean().optional(),
});

module.exports = {
  updateTutorProfileSchema,
};
