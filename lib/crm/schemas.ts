import { z } from "zod";

const optionalText = z.string().trim().optional().transform((value) => value || null);
const optionalUuid = z.string().uuid().optional().or(z.literal("")).transform((value) => value || null);

export const statusSchema = z.enum(["active", "inactive", "archived"]);

export const industrySchema = z.object({
  name: z.string().trim().min(2, "Industry name is required."),
  description: optionalText,
  status: statusSchema.default("active"),
});

export const companyCategorySchema = z.object({
  name: z.string().trim().min(2, "Category name is required."),
  code: z.string().trim().min(1, "Category code is required.").max(12, "Use a short category code."),
  description: optionalText,
  priority_level: z.coerce.number().int().min(1).max(5),
  status: statusSchema.default("active"),
});

export const pipelineStageSchema = z.object({
  name: z.string().trim().min(2, "Stage name is required."),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, "Use a valid hex color."),
  probability: z.coerce.number().int().min(0).max(100),
  position: z.coerce.number().int().min(1),
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
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")).transform((value) => value || null),
  website: z.string().trim().url("Enter a valid URL including https://").optional().or(z.literal("")).transform((value) => value || null),
  address: optionalText,
  city: optionalText,
  country: optionalText,
  success_rating: z.coerce.number().int().min(1).max(10).optional().or(z.literal("")).transform((value) => value === "" ? null : value),
  lead_temperature: z.enum(["cold", "warm", "hot"]),
  estimated_value: z.coerce.number().min(0).optional().or(z.literal("")).transform((value) => value === "" ? null : value),
  expected_closing_date: z.string().optional().or(z.literal("")).transform((value) => value || null),
  notes: optionalText,
});

export type IndustryInput = z.infer<typeof industrySchema>;
export type CompanyCategoryInput = z.infer<typeof companyCategorySchema>;
export type PipelineStageInput = z.infer<typeof pipelineStageSchema>;
export type CompanyInput = z.infer<typeof companySchema>;
export type CompanyFormValues = z.input<typeof companySchema>;
