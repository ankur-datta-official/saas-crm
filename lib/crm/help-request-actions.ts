"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireAuth, requireOrganization } from "@/lib/auth/session";
import { helpRequestSchema, helpRequestUpdateSchema } from "@/lib/crm/schemas";
import { createClient } from "@/lib/supabase/server";
import type { CrmActionState } from "./actions";

async function insertActivityLog(
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, unknown> = {}
) {
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

async function validateHelpRequestOwnership(helpRequestId: string) {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("help_requests")
    .select("id, company_id, organization_id")
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id)
    .maybeSingle();

  if (error || !data) {
    throw new Error("Help request not found or access denied.");
  }

  return { organization, helpRequest: data };
}

export async function createHelpRequest(
  formData: FormData
): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  const rawValues = Object.fromEntries(formData.entries());
  const validated = helpRequestSchema.safeParse(rawValues);

  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.errors[0]?.message || "Validation failed",
      fieldErrors: Object.fromEntries(
        validated.error.errors.map((e) => [e.path[0], e.message])
      ),
    };
  }

  const { data, error } = await supabase
    .from("help_requests")
    .insert({
      ...validated.data,
      organization_id: organization.id,
      requested_by: user.id,
      created_by: user.id,
      updated_by: user.id,
    })
    .select("id, title, company_id")
    .single();

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("created", "help_request", data.id, {
    title: data.title,
    help_type: validated.data.help_type,
    priority: validated.data.priority,
  });

  revalidatePath("/need-help");
  revalidatePath(`/companies/${validated.data.company_id}`);

  return { ok: true, id: data.id };
}

export async function updateHelpRequest(
  helpRequestId: string,
  formData: FormData
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const rawValues = Object.fromEntries(formData.entries());
  const validated = helpRequestUpdateSchema.safeParse(rawValues);

  if (!validated.success) {
    return {
      ok: false,
      error: validated.error.errors[0]?.message || "Validation failed",
      fieldErrors: Object.fromEntries(
        validated.error.errors.map((e) => [e.path[0], e.message])
      ),
    };
  }

  const { error } = await supabase
    .from("help_requests")
    .update({
      ...validated.data,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("updated", "help_request", helpRequestId, {
    title: validated.data.title,
  });

  revalidatePath("/need-help");
  revalidatePath(`/need-help/${helpRequestId}`);
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true, id: helpRequestId };
}

export async function assignHelpRequest(
  helpRequestId: string,
  assignedTo: string,
  setInProgress: boolean = false
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const updateData: Record<string, unknown> = {
    assigned_to: assignedTo,
    updated_by: user.id,
    updated_at: new Date().toISOString(),
  };

  if (setInProgress) {
    updateData.status = "in_progress";
  }

  const { error } = await supabase
    .from("help_requests")
    .update(updateData)
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("assigned", "help_request", helpRequestId, {
    assigned_to: assignedTo,
  });

  revalidatePath("/need-help");
  revalidatePath(`/need-help/${helpRequestId}`);
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true };
}

export async function resolveHelpRequest(
  helpRequestId: string,
  resolutionNote?: string
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "resolved",
      resolution_note: resolutionNote || null,
      resolved_at: new Date().toISOString(),
      resolved_by: user.id,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("resolved", "help_request", helpRequestId, {
    resolution_note: resolutionNote,
  });

  revalidatePath("/need-help");
  revalidatePath(`/need-help/${helpRequestId}`);
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true };
}

export async function rejectHelpRequest(
  helpRequestId: string,
  reason?: string
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "rejected",
      resolution_note: reason || null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("rejected", "help_request", helpRequestId, {
    reason,
  });

  revalidatePath("/need-help");
  revalidatePath(`/need-help/${helpRequestId}`);
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true };
}

export async function reopenHelpRequest(
  helpRequestId: string
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "open",
      resolution_note: null,
      resolved_at: null,
      resolved_by: null,
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("reopened", "help_request", helpRequestId);

  revalidatePath("/need-help");
  revalidatePath(`/need-help/${helpRequestId}`);
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true };
}

export async function archiveHelpRequest(
  helpRequestId: string
): Promise<CrmActionState> {
  const user = await requireAuth();
  const { organization, helpRequest } = await validateHelpRequestOwnership(
    helpRequestId
  );
  const supabase = await createClient();

  const { error } = await supabase
    .from("help_requests")
    .update({
      status: "archived",
      updated_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", helpRequestId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("archived", "help_request", helpRequestId);

  revalidatePath("/need-help");
  revalidatePath(`/companies/${helpRequest.company_id}`);

  return { ok: true };
}

export async function addHelpRequestComment(
  helpRequestId: string,
  comment: string,
  isInternal: boolean = true
): Promise<CrmActionState> {
  const user = await requireAuth();
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { error } = await supabase
    .from("help_request_comments")
    .insert({
      organization_id: organization.id,
      help_request_id: helpRequestId,
      user_id: user.id,
      comment,
      is_internal: isInternal,
    });

  if (error) {
    return { ok: false, error: error.message };
  }

  await insertActivityLog("commented", "help_request", helpRequestId, {
    is_internal: isInternal,
  });

  revalidatePath(`/need-help/${helpRequestId}`);

  return { ok: true };
}
