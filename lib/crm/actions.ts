"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import {
  companyCategorySchema,
  companySchema,
  contactPersonSchema,
  interactionSchema,
  industrySchema,
  pipelineStageSchema,
  temperatureFromRating,
} from "@/lib/crm/schemas";
import { slugify } from "@/lib/crm/utils";
import { createClient } from "@/lib/supabase/server";
import { checkCompanyLimit, requireFeature } from "@/lib/subscription/subscription-queries";

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

async function validateInteractionRelations(
  organizationId: string,
  values: { company_id: string; contact_person_id: string | null; assigned_user_id: string | null },
) {
  const supabase = await createClient();
  const fieldErrors: Record<string, string> = {};
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", values.company_id)
    .eq("organization_id", organizationId)
    .neq("status", "archived")
    .maybeSingle();

  if (!company) fieldErrors.company_id = "Selected company is not available in this workspace.";

  if (values.contact_person_id) {
    const { data: contact } = await supabase
      .from("contact_persons")
      .select("id")
      .eq("id", values.contact_person_id)
      .eq("company_id", values.company_id)
      .eq("organization_id", organizationId)
      .neq("status", "archived")
      .maybeSingle();
    if (!contact) fieldErrors.contact_person_id = "Selected contact does not belong to this company.";
  }

  if (values.assigned_user_id) {
    const { data: assigned } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", values.assigned_user_id)
      .eq("organization_id", organizationId)
      .maybeSingle();
    if (!assigned) fieldErrors.assigned_user_id = "Selected assigned user is not part of this workspace.";
  }

  return fieldErrors;
}

async function requireInteractionInOrganization(interactionId: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .select("id, company_id, success_rating, lead_temperature")
    .eq("id", interactionId)
    .eq("organization_id", organization.id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Meeting was not found in your workspace.");
  return { organization, interaction: data };
}

async function updateCompanyRatingFromInteraction(companyId: string, rating: number | null, temperature: string | null) {
  if (!rating) return;
  const organization = await requireOrganization();
  const resolvedTemperature = temperature ?? temperatureFromRating(rating);
  const supabase = await createClient();
  await supabase
    .from("companies")
    .update({ success_rating: rating, lead_temperature: resolvedTemperature })
    .eq("id", companyId)
    .eq("organization_id", organization.id);
  await insertActivityLog("company.rating_updated_from_meeting", "company", companyId, {
    success_rating: rating,
    lead_temperature: resolvedTemperature,
  });
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

  try {
    await requireFeature("custom_pipeline");
  } catch (error) {
    await insertActivityLog("subscription.feature_blocked", "organization", organization.id, {
      feature: "custom_pipeline",
    });
    return { ok: false, error: error instanceof Error ? error.message : "Upgrade required to customize pipeline stages." };
  }

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

  try {
    await requireFeature("custom_pipeline");
  } catch (error) {
    await insertActivityLog("subscription.feature_blocked", "organization", organization.id, {
      feature: "custom_pipeline",
    });
    return { ok: false, error: error instanceof Error ? error.message : "Upgrade required to customize pipeline stages." };
  }

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
  try {
    await requireFeature("custom_pipeline");
  } catch (error) {
    await insertActivityLog("subscription.feature_blocked", "organization", organization.id, {
      feature: "custom_pipeline",
    });
    return { ok: false, error: error instanceof Error ? error.message : "Upgrade required to customize pipeline stages." };
  }

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

  const companyLimit = await checkCompanyLimit(1);
  if (!companyLimit.allowed) {
    await insertActivityLog("subscription.limit_reached", "organization", organization.id, {
      limit_type: "companies",
      current: companyLimit.current,
      projected: companyLimit.projected,
      max: companyLimit.max,
    });
    return { ok: false, error: companyLimit.message ?? "Company limit reached for the current plan." };
  }

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

export async function createInteractionAction(values: unknown): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const parsed = interactionSchema.safeParse(values);
  if (!parsed.success) return getValidationState(parsed.error);

  const relationErrors = await validateInteractionRelations(organization.id, parsed.data);
  if (Object.keys(relationErrors).length > 0) return { ok: false, error: Object.values(relationErrors)[0], fieldErrors: relationErrors };

  const meetingDatetime = parsed.data.meeting_datetime ?? new Date().toISOString();
  const leadTemperature = parsed.data.lead_temperature ?? temperatureFromRating(parsed.data.success_rating);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("interactions")
    .insert({
      ...parsed.data,
      meeting_datetime: meetingDatetime,
      lead_temperature: leadTemperature,
      organization_id: organization.id,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id")
    .single();

  if (error) return { ok: false, error: error.message };
  await insertActivityLog("meeting.created", "interaction", data.id, { company_id: parsed.data.company_id });
  if (parsed.data.next_followup_at) await insertActivityLog("meeting.next_followup_added", "interaction", data.id, { next_followup_at: parsed.data.next_followup_at });
  await updateCompanyRatingFromInteraction(parsed.data.company_id, parsed.data.success_rating, leadTemperature);
  revalidatePath("/meetings");
  revalidatePath(`/companies/${parsed.data.company_id}`);
  return { ok: true, id: data.id };
}

export async function updateInteractionAction(id: string, values: unknown): Promise<CrmActionState> {
  const parsed = interactionSchema.safeParse(values);
  if (!parsed.success) return getValidationState(parsed.error);

  try {
    const { organization, interaction } = await requireInteractionInOrganization(id);
    const relationErrors = await validateInteractionRelations(organization.id, parsed.data);
    if (Object.keys(relationErrors).length > 0) return { ok: false, error: Object.values(relationErrors)[0], fieldErrors: relationErrors };

    const leadTemperature = parsed.data.lead_temperature ?? temperatureFromRating(parsed.data.success_rating);
    const supabase = await createClient();
    const { error } = await supabase
      .from("interactions")
      .update({ ...parsed.data, lead_temperature: leadTemperature, meeting_datetime: parsed.data.meeting_datetime ?? new Date().toISOString() })
      .eq("id", id)
      .eq("organization_id", organization.id);

    if (error) return { ok: false, error: error.message };
    await insertActivityLog("meeting.updated", "interaction", id, { company_id: parsed.data.company_id });
    if (parsed.data.next_followup_at) await insertActivityLog("meeting.next_followup_added", "interaction", id, { next_followup_at: parsed.data.next_followup_at });
    await updateCompanyRatingFromInteraction(parsed.data.company_id, parsed.data.success_rating, leadTemperature);
    revalidatePath("/meetings");
    revalidatePath(`/meetings/${id}`);
    revalidatePath(`/companies/${interaction.company_id}`);
    revalidatePath(`/companies/${parsed.data.company_id}`);
    return { ok: true, id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to update meeting." };
  }
}

export async function archiveInteractionAction(id: string): Promise<CrmActionState> {
  try {
    const { organization, interaction } = await requireInteractionInOrganization(id);
    const supabase = await createClient();
    const { error } = await supabase
      .from("interactions")
      .update({ status: "archived" })
      .eq("id", id)
      .eq("organization_id", organization.id);
    if (error) return { ok: false, error: error.message };
    await insertActivityLog("meeting.archived", "interaction", id, { company_id: interaction.company_id });
    revalidatePath("/meetings");
    revalidatePath(`/companies/${interaction.company_id}`);
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to archive meeting." };
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
