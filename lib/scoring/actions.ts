"use server";

import { z } from "zod";
import { requireAuth, requireOrganization, requirePermission } from "@/lib/auth/session";
import { getSafeErrorMessage } from "@/lib/errors";
import { createClient } from "@/lib/supabase/server";
import { adjustWalletBalance, redeemWalletReward } from "./service";

type ScoringActionState = {
  ok: boolean;
  error?: string;
  id?: string;
};

const leadScoreRuleSchema = z.object({
  action_key: z.string().trim().min(2),
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  points: z.coerce.number().int(),
  is_active: z.coerce.boolean().default(true),
  rule_scope: z.record(z.unknown()).optional().default({}),
});

const leadSourceRuleSchema = z.object({
  source_name: z.string().trim().min(1),
  bonus_points: z.coerce.number().int(),
  is_active: z.coerce.boolean().default(true),
  rule_scope: z.record(z.unknown()).optional().default({}),
});

const rewardSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  reward_type: z.enum(["badge", "discount", "premium_feature", "manual_reward"]),
  cost_points: z.coerce.number().int().min(0),
  feature_key: z.string().trim().optional().nullable(),
  inventory: z.preprocess((value) => (value === "" || value === null || value === undefined ? null : value), z.coerce.number().int().min(0).nullable()),
  fulfillment_mode: z.enum(["automatic", "manual"]),
  is_active: z.coerce.boolean().default(true),
  metadata: z.record(z.unknown()).optional().default({}),
});

const challengeTemplateSchema = z.object({
  name: z.string().trim().min(2),
  description: z.string().trim().optional().nullable(),
  cadence: z.enum(["daily", "weekly"]),
  target_metric: z.string().trim().min(2),
  target_count: z.coerce.number().int().min(1),
  bonus_points: z.coerce.number().int().min(0),
  is_active: z.coerce.boolean().default(true),
  starts_at: z.string().trim().optional().nullable(),
  ends_at: z.string().trim().optional().nullable(),
  config: z.record(z.unknown()).optional().default({}),
});

async function upsertTableRow<T extends z.ZodTypeAny>(
  table: string,
  id: string | null,
  schema: T,
  values: unknown,
): Promise<ScoringActionState> {
  const organization = await requireOrganization();
  const parsed = schema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const supabase = await createClient();
  const payload = {
    ...parsed.data,
    organization_id: organization.id,
  };

  const query = id
    ? supabase.from(table).update(payload).eq("id", id).eq("organization_id", organization.id)
    : supabase.from(table).insert(payload).select("id").single();

  const { data, error } = await query;

  if (error) {
    return { ok: false, error: getSafeErrorMessage(error, "Unable to save scoring data.") };
  }

  return { ok: true, id: (data as { id?: string } | null)?.id ?? id ?? undefined };
}

export async function createLeadScoreRuleAction(values: unknown) {
  await requirePermission("scoring.manage");
  return upsertTableRow("lead_score_rules", null, leadScoreRuleSchema, values);
}

export async function updateLeadScoreRuleAction(id: string, values: unknown) {
  await requirePermission("scoring.manage");
  return upsertTableRow("lead_score_rules", id, leadScoreRuleSchema, values);
}

export async function archiveLeadScoreRuleAction(id: string) {
  await requirePermission("scoring.manage");
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_score_rules")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createLeadSourceScoreRuleAction(values: unknown) {
  await requirePermission("scoring.manage");
  const parsed = leadSourceRuleSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("lead_source_score_rules")
    .insert({
      ...parsed.data,
      organization_id: organization.id,
      normalized_source: parsed.data.source_name.trim().toLowerCase(),
    })
    .select("id")
    .single();

  if (error) {
    return { ok: false, error: getSafeErrorMessage(error, "Unable to create the lead source rule.") };
  }

  return { ok: true, id: data.id };
}

export async function updateLeadSourceScoreRuleAction(id: string, values: unknown) {
  await requirePermission("scoring.manage");
  const parsed = leadSourceRuleSchema.safeParse(values);

  if (!parsed.success) {
    return { ok: false, error: parsed.error.errors[0]?.message ?? "Invalid input." };
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_source_score_rules")
    .update({
      ...parsed.data,
      normalized_source: parsed.data.source_name.trim().toLowerCase(),
    })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: getSafeErrorMessage(error, "Unable to update the lead source rule.") };
  }

  return { ok: true, id };
}

export async function archiveLeadSourceScoreRuleAction(id: string) {
  await requirePermission("scoring.manage");
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("lead_source_score_rules")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createRewardAction(values: unknown) {
  await requirePermission("rewards.manage");
  return upsertTableRow("rewards_catalog", null, rewardSchema, values);
}

export async function updateRewardAction(id: string, values: unknown) {
  await requirePermission("rewards.manage");
  return upsertTableRow("rewards_catalog", id, rewardSchema, values);
}

export async function archiveRewardAction(id: string) {
  await requirePermission("rewards.manage");
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("rewards_catalog")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function createChallengeTemplateAction(values: unknown) {
  await requirePermission("scoring.manage");
  return upsertTableRow("challenge_templates", null, challengeTemplateSchema, values);
}

export async function updateChallengeTemplateAction(id: string, values: unknown) {
  await requirePermission("scoring.manage");
  return upsertTableRow("challenge_templates", id, challengeTemplateSchema, values);
}

export async function archiveChallengeTemplateAction(id: string) {
  await requirePermission("scoring.manage");
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { error } = await supabase
    .from("challenge_templates")
    .update({ is_active: false })
    .eq("id", id)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true };
}

export async function redeemRewardAction(rewardId: string): Promise<ScoringActionState> {
  await requireAuth();

  try {
    const result = await redeemWalletReward(rewardId, {});
    return { ok: true, id: result?.redemption_id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to redeem reward." };
  }
}

export async function adjustWalletBalanceAction(
  userId: string,
  pointsDelta: number,
  reason: string,
): Promise<ScoringActionState> {
  await requirePermission("scoring.manage");
  const organization = await requireOrganization();
  const actor = await requireAuth();

  try {
    const result = await adjustWalletBalance({
      organizationId: organization.id,
      userId,
      actorUserId: actor.id,
      pointsDelta,
      reason,
      idempotencyKey: `manual_adjustment:${userId}:${actor.id}:${Date.now()}`,
    });

    return { ok: true, id: result?.transaction_id };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : "Unable to adjust wallet balance." };
  }
}

export async function fulfillRewardRedemptionAction(
  redemptionId: string,
  status: "fulfilled" | "rejected" | "cancelled",
  fulfillmentNotes?: string,
): Promise<ScoringActionState> {
  await requirePermission("rewards.manage");
  const organization = await requireOrganization();
  const actor = await requireAuth();
  const supabase = await createClient();
  const { error } = await supabase
    .from("reward_redemptions")
    .update({
      status,
      fulfillment_notes: fulfillmentNotes ?? null,
      processed_by: actor.id,
      processed_at: new Date().toISOString(),
    })
    .eq("id", redemptionId)
    .eq("organization_id", organization.id);

  if (error) {
    return { ok: false, error: error.message };
  }

  return { ok: true, id: redemptionId };
}
