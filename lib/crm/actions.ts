"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import {
  companyCategorySchema,
  companySchema,
  contactPersonSchema,
  industrySchema,
  pipelineStageSchema,
} from "@/lib/crm/schemas";
import { slugify } from "@/lib/crm/utils";
import { createClient } from "@/lib/supabase/server";

export type CrmActionState = {
  ok: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  id?: string;
};

function getFirstError(error: z.ZodError) {
  return error.errors[0]?.message ?? "Please check the form and try again.";
}

function getFieldErrors(error: z.ZodError) {
  return Object.fromEntries(
    error.errors
      .filter((issue) => issue.path.length > 0)
      .map((issue) => [String(issue.path[0]), issue.message]),
  );
}

function getValidationState(error: z.ZodError): CrmActionState {
  return {
    ok: false,
    error: getFirstError(error),
    fieldErrors: getFieldErrors(error),
  };
}

function makeShortCode(value: string) {
  const code = value
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9+]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 12);

  return code || `CAT-${Date.now().toString().slice(-4)}`;
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

async function requireCompanyInOrganization(companyId: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("companies")
    .select("id, name")
    .eq("id", companyId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Company was not found in your workspace.");
  }

  return { organization, company: data };
}

async function validateCompanyRelations(
  organizationId: string,
  values: {
    industry_id: string | null;
    category_id: string | null;
    pipeline_stage_id: string | null;
    assigned_user_id: string | null;
  },
): Promise<Record<string, string>> {
  const supabase = await createClient();
  const fieldErrors: Record<string, string> = {};

  if (values.industry_id) {
    const { data: industry } = await supabase
      .from("industries")
      .select("id")
      .eq("id", values.industry_id)
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .maybeSingle();

    if (!industry) {
      fieldErrors.industry_id = "Selected industry is not available in this workspace.";
    }
  }

  if (values.category_id) {
    const { data: category } = await supabase
      .from("company_categories")
      .select("id")
      .eq("id", values.category_id)
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .maybeSingle();

    if (!category) {
      fieldErrors.category_id = "Selected category is not available in this workspace.";
    }
  }

  if (values.pipeline_stage_id) {
    const { data: stage } = await supabase
      .from("pipeline_stages")
      .select("id")
      .eq("id", values.pipeline_stage_id)
      .eq("organization_id", organizationId)
      .eq("is_active", true)
      .maybeSingle();

    if (!stage) {
      fieldErrors.pipeline_stage_id = "Selected pipeline stage is not available in this workspace.";
    }
  }

  if (values.assigned_user_id) {
    const { data: assignedUser } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", values.assigned_user_id)
      .eq("organization_id", organizationId)
      .maybeSingle();

    if (!assignedUser) {
      fieldErrors.assigned_user_id = "Selected assigned user is not part of this workspace.";
    }
  }

  return fieldErrors;
}

async function requireContactInOrganization(contactId: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("contact_persons")
    .select("id, company_id, is_primary, name")
    .eq("id", contactId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Contact was not found in your workspace.");
  }

  return { organization, contact: data };
}

export async function createIndustryAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const parsed = industrySchema.safeParse(values);

  if (!parsed.success) return getValidationState(parsed.error);

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

  if (!parsed.success) return getValidationState(parsed.error);

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

  if (!parsed.success) return getValidationState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("company_categories").insert({
    ...parsed.data,
    code: makeShortCode(parsed.data.code ?? parsed.data.name),
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

  if (!parsed.success) return getValidationState(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase
    .from("company_categories")
    .update({ ...parsed.data, code: makeShortCode(parsed.data.code ?? parsed.data.name) })
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

  if (!parsed.success) return getValidationState(parsed.error);

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

  if (!parsed.success) return getValidationState(parsed.error);

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

  if (!parsed.success) return getValidationState(parsed.error);

  const relationErrors = await validateCompanyRelations(organization.id, parsed.data);
  if (Object.keys(relationErrors).length > 0) {
    return {
      ok: false,
      error: Object.values(relationErrors)[0],
      fieldErrors: relationErrors,
    };
  }

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
  return { ok: true, id: data.id };
}

export async function updateCompanyAction(id: string, values: unknown): Promise<CrmActionState> {
  const organization = await requireOrganization();
  const parsed = companySchema.safeParse(values);

  if (!parsed.success) return getValidationState(parsed.error);

  const relationErrors = await validateCompanyRelations(organization.id, parsed.data);
  if (Object.keys(relationErrors).length > 0) {
    return {
      ok: false,
      error: Object.values(relationErrors)[0],
      fieldErrors: relationErrors,
    };
  }

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
  return { ok: true, id };
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

export async function createContactAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const parsed = contactPersonSchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  try {
    const { organization } = await requireCompanyInOrganization(parsed.data.company_id);
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("contact_persons")
      .insert({
        ...parsed.data,
        organization_id: organization.id,
        created_by: user.id,
        updated_by: user.id,
      })
      .select("id")
      .single();

    if (error) return { ok: false, error: error.message };

    await insertActivityLog("contact.created", "contact_person", data.id, {
      company_id: parsed.data.company_id,
      name: parsed.data.name,
    });

    if (parsed.data.is_primary) {
      await insertActivityLog("contact.primary_changed", "contact_person", data.id, {
        company_id: parsed.data.company_id,
      });
    }

    revalidatePath("/contacts");
    revalidatePath(`/companies/${parsed.data.company_id}`);
    return { ok: true, id: data.id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to create contact." };
  }
}

export async function updateContactAction(id: string, values: unknown): Promise<CrmActionState> {
  const parsed = contactPersonSchema.safeParse(values);

  if (!parsed.success) return { ok: false, error: getFirstError(parsed.error) };

  try {
    const { organization, contact } = await requireContactInOrganization(id);
    await requireCompanyInOrganization(parsed.data.company_id);
    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_persons")
      .update(parsed.data)
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) return { ok: false, error: error.message };

    await insertActivityLog("contact.updated", "contact_person", id, {
      company_id: parsed.data.company_id,
    });

    if (!contact.is_primary && parsed.data.is_primary) {
      await insertActivityLog("contact.primary_changed", "contact_person", id, {
        company_id: parsed.data.company_id,
      });
    }

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/companies/${contact.company_id}`);
    revalidatePath(`/companies/${parsed.data.company_id}`);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update contact." };
  }
}

export async function archiveContactAction(id: string): Promise<CrmActionState> {
  try {
    const { organization, contact } = await requireContactInOrganization(id);
    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_persons")
      .update({ status: "archived", is_primary: false })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) return { ok: false, error: error.message };

    await insertActivityLog("contact.archived", "contact_person", id, {
      company_id: contact.company_id,
    });

    revalidatePath("/contacts");
    revalidatePath(`/companies/${contact.company_id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to archive contact." };
  }
}

export async function setPrimaryContactAction(id: string): Promise<CrmActionState> {
  try {
    const { organization, contact } = await requireContactInOrganization(id);
    const supabase = await createClient();
    const { error } = await supabase
      .from("contact_persons")
      .update({ is_primary: true })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) return { ok: false, error: error.message };

    await insertActivityLog("contact.primary_changed", "contact_person", id, {
      company_id: contact.company_id,
    });

    revalidatePath("/contacts");
    revalidatePath(`/contacts/${id}`);
    revalidatePath(`/companies/${contact.company_id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to set primary contact." };
  }
}
