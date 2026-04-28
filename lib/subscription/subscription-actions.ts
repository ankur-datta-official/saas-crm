"use server";

import { revalidatePath } from "next/cache";
import { getCurrentUser, hasPermission, requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";
import { getAllPlans } from "./subscription-queries";

async function insertActivityLog(action: string, entityId: string, metadata: Record<string, unknown>) {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const user = await getCurrentUser();

  await supabase.from("activity_logs").insert({
    organization_id: organization.id,
    actor_user_id: user?.id ?? null,
    action,
    entity_type: "organization_subscription",
    entity_id: entityId,
    metadata,
  });
}

export async function switchSubscriptionPlan(planId: string) {
  const allowed = await hasPermission("subscription.manage");
  if (!allowed) {
    throw new Error("You do not have permission to change the subscription plan.");
  }

  const organization = await requireOrganization();
  const supabase = await createClient();
  const plans = await getAllPlans();
  const selectedPlan = plans.find((plan) => plan.id === planId);

  if (!selectedPlan) {
    throw new Error("Selected plan was not found.");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("organization_subscriptions")
    .select("id, plan_id")
    .eq("organization_id", organization.id)
    .single();

  if (subscriptionError || !subscription) {
    throw new Error(subscriptionError?.message ?? "Subscription record was not found.");
  }

  if (subscription.plan_id === planId) {
    return { success: true };
  }

  const { error } = await supabase
    .from("organization_subscriptions")
    .update({
      plan_id: planId,
      status: "active",
      current_period_starts_at: new Date().toISOString(),
    })
    .eq("id", subscription.id)
    .eq("organization_id", organization.id);

  if (error) {
    throw new Error(error.message);
  }

  await insertActivityLog("subscription.plan_changed", subscription.id, {
    plan_id: planId,
    plan_name: selectedPlan.name,
    plan_slug: selectedPlan.slug,
  });

  revalidatePath("/subscription");
  revalidatePath("/dashboard");
  return { success: true };
}
