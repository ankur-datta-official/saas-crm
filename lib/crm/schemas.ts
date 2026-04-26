import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalUuid = z.string().uuid().optional().or(z.literal("")).transform((value) => value || null);
const optionalEmail = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().email("Enter a valid email.").optional(),
).transform((value) => value ?? null);
const optionalUrl = (message: string) => z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().trim().url(message).optional(),
).transform((value) => value ?? null);
const optionalNumber = (schema: z.ZodNumber) => z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? undefined : value),
  schema.optional(),
).transform((value) => value ?? null);
const optionalDate = z.preprocess(
  (value) => (typeof value === "string" && value.trim() === "" ? undefined : value),
  z.string().optional(),
).transform((value) => value ?? null);
const optionalNumberWithDefault = (schema: z.ZodNumber, fallback: number) => z.preprocess(
  (value) => (value === "" || value === null || value === undefined ? fallback : value),
  schema,
);

export const statusSchema = z.enum(["active", "inactive", "archived"]);

export const industrySchema = z.object({
  name: z.string().trim().min(2, "Industry name is required."),
  description: optionalText,
  status: statusSchema.default("active"),
});

export const companyCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required."),
  code: z.string().trim().max(12, "Use a short category code.").optional().transform((value) => value || null),
  description: optionalText,
  priority_level: optionalNumberWithDefault(z.coerce.number().int().min(1).max(5), 3),
  status: statusSchema.default("active"),
});

export const pipelineStageSchema = z.object({
  name: z.string().trim().min(2, "Stage name is required."),
  color: z.string().optional().transform((value) => value || "#0f766e").pipe(z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a valid hex color.")),
  probability: optionalNumberWithDefault(z.coerce.number().int().min(0).max(100), 0),
  position: optionalNumberWithDefault(z.coerce.number().int().min(1), 1),
  is_won: z.boolean().default(false),
  is_lost: z.boolean().default(false),
  is_active: z.boolean().default(true),
});

export const companySchema = z.object({
  name: z.string().trim().min(2, "Company name is required."),
  industry_id: optionalUuid,
  category_id: optionalUuid,
  lead_source: optionalText,
  priority: z.enum(["low", "medium", "high", "urgent"]),
  assigned_user_id: optionalUuid,
  pipeline_stage_id: optionalUuid,
  status: statusSchema.default("active"),
  phone: optionalText,
  whatsapp: optionalText,
  email: optionalEmail,
  website: optionalUrl("Enter a valid URL including https://."),
  address: optionalText,
  city: optionalText,
  country: optionalText,
  success_rating: optionalNumber(z.coerce.number().int().min(1, "Success rating must be between 1 and 10.").max(10, "Success rating must be between 1 and 10.")),
  lead_temperature: z.enum(["cold", "warm", "hot"]),
  estimated_value: optionalNumber(z.coerce.number().min(0, "Estimated value must be zero or greater.")),
  expected_closing_date: optionalDate,
  notes: optionalText,
});

export const decisionRoleOptions = [
  "Owner",
  "CEO / MD",
  "Director",
  "Procurement",
  "IT Head",
  "Admin",
  "Engineer",
  "Finance",
  "Influencer",
  "Gatekeeper",
  "Other",
] as const;

export const relationshipLevelOptions = [
  "New",
  "Known",
  "Warm",
  "Strong",
  "Decision Maker",
  "Risky",
  "Inactive",
] as const;

export const preferredContactMethodOptions = [
  "Phone",
  "WhatsApp",
  "Email",
  "LinkedIn",
  "Physical Meeting",
] as const;

export const contactPersonSchema = z.object({
  name: z.string().trim().min(2, "Contact name is required."),
  company_id: z.string().uuid("Company is required."),
  designation: optionalText,
  department: optionalText,
  mobile: optionalText,
  whatsapp: optionalText,
  email: optionalEmail,
  linkedin: optionalUrl("Enter a valid LinkedIn URL including https://"),
  decision_role: z.enum(decisionRoleOptions).optional().or(z.literal("")).transform((value) => value || null),
  relationship_level: z.enum(relationshipLevelOptions).optional().or(z.literal("")).transform((value) => value || null),
  preferred_contact_method: z.enum(preferredContactMethodOptions).optional().or(z.literal("")).transform((value) => value || null),
  remarks: optionalText,
  is_primary: z.boolean().default(false),
  status: statusSchema.default("active"),
});

export type IndustryInput = z.infer<typeof industrySchema>;
export type CompanyCategoryInput = z.infer<typeof companyCategorySchema>;
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type CompanyFormValues = z.input<typeof companySchema>;
export type ContactPersonInput = z.infer<typeof contactPersonSchema>;
export type ContactPersonFormValues = z.input<typeof contactPersonSchema>;
