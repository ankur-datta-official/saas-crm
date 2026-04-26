"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getWorkspaceErrorMessage } from "@/lib/auth/errors";
import { requireAuth } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const workspaceSchema = z.object({
  name: z.string().trim().min(2, "Workspace name is required."),
  companySize: z.string().trim().min(1, "Company size is required."),
});

export type WorkspaceActionState =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

export async function createWorkspaceAction(values: unknown): Promise<WorkspaceActionState> {
  await requireAuth();

  const parsed = workspaceSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid workspace details." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_organization_workspace", {
    workspace_name: parsed.data.name,
    company_size_text: parsed.data.companySize,
  });

  if (error) {
    return { ok: false, error: getWorkspaceErrorMessage(error.message) };
  }

  revalidatePath("/", "layout");

  return { ok: true, organizationId: data as string };
}
