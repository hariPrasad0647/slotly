
const { z } = require("zod");

const socialLinksSchema = z
  .object({
    website: z.string().trim().url().optional(),
    linkedin: z.string().trim().url().optional(),
    twitter: z.string().trim().url().optional(),
    instagram: z.string().trim().url().optional(),
    youtube: z.string().trim().url().optional(),
  })
  .partial();

const updateTutorProfileSchema = z.object({
  displayName: z.string().trim().min(1).max(150).optional(),
  headline: z.string().trim().min(1).max(150).optional(),
  bio: z.string().trim().min(1).max(2000).optional(),
  avatarUrl: z.string().trim().url().optional(),
  experienceYears: z.number().int().min(0).max(80).optional(),
  expertise: z.array(z.string().trim().min(1).max(100)).max(20).optional(),
  qualifications: z.array(z.string().trim().min(1).max(200)).max(20).optional(),
  languages: z.array(z.string().trim().min(1).max(50)).max(20).optional(),
  socialLinks: socialLinksSchema.optional(),
  isPublic: z.boolean().optional(),
});

module.exports = {
  updateTutorProfileSchema,
};
