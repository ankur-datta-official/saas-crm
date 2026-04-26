"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import {
  companyCategorySchema,
  companySchema,
  industrySchema,
  pipelineStageSchema,
} from "@/lib/crm/schemas";
import { slugify } from "@/lib/crm/utils";
import { createClient } from "@/lib/supabase/server";

export type CrmActionState = {
  ok: boolean;
  error?: string;
  id?: string;
};

function getFirstError(error: z.ZodError) {
  return error.errors[0]?.message ?? "Please check the form and try again.";
}

async function insertActivityLog(action: string, entityType: string, entityId: string, metadata: Record<string, unknown> = {}) {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  await supabase.from("activity_logs").insert({
    organization_id: organization.id,
    actor_user_id: user.id,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
  });
}

export async function createIndustryAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const parsed = industrySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("industries").insert({
    ...parsed.data,
    organization_id: organization.id,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings");
  revalidatePath("/settings/industries");
  return { ok: true };
}

export async function updateIndustryAction(id: string, values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = industrySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("industries")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/industries");
  return { ok: true };
}

export async function archiveIndustryAction(id: string): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("industries")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/industries");
  return { ok: true };
}

export async function createCompanyCategoryAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const parsed = companyCategorySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("company_categories").insert({
    ...parsed.data,
    code: parsed.data.code.toUpperCase(),
    organization_id: organization.id,
    created_by: user.id,
    updated_by: user.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/company-categories");
  return { ok: true };
}

export async function updateCompanyCategoryAction(id: string, values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = companyCategorySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_categories")
    .update({ ...parsed.data, code: parsed.data.code.toUpperCase() })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/company-categories");
  return { ok: true };
}

export async function archiveCompanyCategoryAction(id: string): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("company_categories")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/company-categories");
  return { ok: true };
}

export async function createPipelineStageAction(values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = pipelineStageSchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.from("pipeline_stages").insert({
    ...parsed.data,
    slug: `${slugify(parsed.data.name)}-${Date.now()}`,
    organization_id: organization.id,
  });

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/pipeline");
  return { ok: true };
}

export async function updatePipelineStageAction(id: string, values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = pipelineStageSchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase
    .from("pipeline_stages")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/pipeline");
  revalidatePath("/companies");
  return { ok: true };
}

export async function archivePipelineStageAction(id: string): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("pipeline_stages")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  revalidatePath("/settings/pipeline");
  return { ok: true };
}

export async function createCompanyAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const parsed = companySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .insert({
      ...parsed.data,
      organization_id: organization.id,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };

  await insertActivityLog("company.created", "company", data.id, { name: parsed.data.name });
  revalidatePath("/companies");
  redirect(`/companies/${data.id}`);
}

export async function updateCompanyAction(id: string, values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = companySchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  const supabase = await createClient();
  const { data: existing, error: existingError } = await supabase
    .from("companies")
    .select("pipeline_stage_id")
    .eq("id", id)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (existingError) return { ok: false, error: existingError.message };

  const { error } = await supabase
    .from("companies")
    .update(parsed.data)
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  await insertActivityLog("company.updated", "company", id);

  if (existing?.pipeline_stage_id !== parsed.data.pipeline_stage_id) {
    await insertActivityLog("company.pipeline_stage_changed", "company", id, {
      from: existing?.pipeline_stage_id,
      to: parsed.data.pipeline_stage_id,
    });
  }

  revalidatePath("/companies");
  revalidatePath(`/companies/${id}`);
  redirect(`/companies/${id}`);
}

export async function archiveCompanyAction(id: string): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("companies")
    .update({ status: "archived" })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) return { ok: false, error: error.message };

  await insertActivityLog("company.archived", "company", id);
  revalidatePath("/companies");
  return { ok: true };
}
