import { createClient } from "@/lib/supabase/server";
import type { ScoringEventResult } from "./types";

type ApplyScoringEventInput = {
  organizationId: string;
  userId: string;
  actionKey: string;
  companyId?: string | null;
  followupId?: string | null;
  sourceRecordId?: string | null;
  sourceRecordType?: string | null;
  metadata?: Record<string, unknown>;
  actorUserId?: string | null;
  happenedAt?: string;
  addToLeadScore?: boolean;
  idempotencyKey: string;
};

type AdjustWalletInput = {
  organizationId: string;
  userId: string;
  actorUserId: string;
  pointsDelta: number;
  reason: string;
  companyId?: string | null;
  rewardId?: string | null;
  sourceRecordId?: string | null;
  sourceRecordType?: string | null;
  addToLeadScore?: boolean;
  idempotencyKey: string;
};

export function buildScoreIdempotencyKey(parts: Array<string | null | undefined>) {
  return parts.filter((value) => value && value.trim().length > 0).join(":");
}

function normalizeRpcSingle<T>(data: T | T[] | null): T | null {
  if (Array.isArray(data)) {
    return data[0] ?? null;
  }

  return data ?? null;
}

export async function applyScoringEvent(input: ApplyScoringEventInput): Promise<ScoringEventResult> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_scoring_event", {
    p_organization_id: input.organizationId,
    p_user_id: input.userId,
    p_action_key: input.actionKey,
    p_company_id: input.companyId ?? null,
    p_followup_id: input.followupId ?? null,
    p_source_record_id: input.sourceRecordId ?? null,
    p_source_record_type: input.sourceRecordType ?? null,
    p_metadata: input.metadata ?? {},
    p_actor_user_id: input.actorUserId ?? input.userId,
    p_happened_at: input.happenedAt ?? new Date().toISOString(),
    p_add_to_lead_score: input.addToLeadScore ?? true,
    p_idempotency_key: input.idempotencyKey,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRpcSingle<ScoringEventResult>(data) ?? {
    transaction_id: null,
    points_awarded: 0,
    balance_after: 0,
    applied: false,
  };
}

export async function adjustWalletBalance(input: AdjustWalletInput) {
  const supabase = await createClient();
  const transactionType = input.pointsDelta > 0 ? "adjustment" : "adjustment";
  const { data, error } = await supabase.rpc("award_wallet_points", {
    p_organization_id: input.organizationId,
    p_user_id: input.userId,
    p_transaction_type: transactionType,
    p_action_key: "manual_adjustment",
    p_points_delta: input.pointsDelta,
    p_company_id: input.companyId ?? null,
    p_followup_id: null,
    p_challenge_id: null,
    p_reward_id: input.rewardId ?? null,
    p_source_record_id: input.sourceRecordId ?? null,
    p_source_record_type: input.sourceRecordType ?? null,
    p_idempotency_key: input.idempotencyKey,
    p_metadata: { reason: input.reason },
    p_created_by: input.actorUserId,
    p_add_to_lead_score: input.addToLeadScore ?? false,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRpcSingle<{
    transaction_id: string;
    points_delta: number;
    balance_after: number;
  }>(data);
}

export async function redeemWalletReward(rewardId: string, metadata: Record<string, unknown> = {}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("redeem_wallet_reward", {
    p_reward_id: rewardId,
    p_metadata: metadata,
  });

  if (error) {
    throw new Error(error.message);
  }

  return normalizeRpcSingle<{
    redemption_id: string;
    transaction_id: string;
    remaining_balance: number;
    status: string;
  }>(data);
}

