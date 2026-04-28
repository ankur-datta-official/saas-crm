import { type LucideIcon, Users, Building2, HardDriveDownload, FileStack } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { GuidanceStrip } from "@/components/shared/guidance-strip";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PlanUsageCard } from "@/components/subscription/plan-usage-card";
import { SubscriptionPlanCard } from "@/components/subscription/subscription-plan-card";
import { UpgradePrompt } from "@/components/subscription/upgrade-prompt";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import {
  formatLimitValue,
  getAllPlans,
  getCurrentPlan,
  getCurrentSubscription,
  getOrganizationUsage,
} from "@/lib/subscription/subscription-queries";

const featureLabels = {
  custom_pipeline: "Custom pipeline configuration",
  pdf_export: "PDF export",
  csv_import: "CSV import",
  advanced_reports: "Advanced reports",
  audit_log: "Audit log access",
} as const;

type PlanFeatureKey = keyof typeof featureLabels;

export default async function SubscriptionPage() {
  await requirePermission("subscription.view");

  const [subscription, currentPlan, usage, plans, canManage] = await Promise.all([
    getCurrentSubscription(),
    getCurrentPlan(),
    getOrganizationUsage(),
    getAllPlans(),
    hasPermission("subscription.manage"),
  ]);

  const statusLabel = subscription?.status ? subscription.status.replace("_", " ") : "Unavailable";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscription"
        description="Review plan packaging, workspace usage, limits, and feature availability."
      />
      <GuidanceStrip>
        Review your current plan, usage limits, and feature access here. Manual plan switching is only for internal testing when enabled.
      </GuidanceStrip>

      {!canManage ? (
        <UpgradePrompt
          title="Billing Integration"
          description="Payment gateway automation is not implemented in this sprint. Organization admins can still review packaging and usage here."
          ctaLabel="View Current Usage"
        />
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>{currentPlan?.name ?? "No active plan"}</CardTitle>
            <CardDescription>
              Status: {statusLabel}
              {subscription?.trial_ends_at ? ` • Trial ends ${new Date(subscription.trial_ends_at).toLocaleDateString()}` : ""}
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <PlanUsageCard
              title="Users"
              description="Active users plus pending invitations consume seats."
              used={usage.reservedSeats}
              limit={currentPlan?.max_users ?? null}
            />
            <PlanUsageCard
              title="Companies"
              description="Active lead and company records in this workspace."
              used={usage.companies}
              limit={currentPlan?.max_companies ?? null}
            />
            <PlanUsageCard
              title="Storage"
              description="Total document storage currently used."
              used={Math.round(usage.storageUsedMb)}
              limit={currentPlan?.storage_limit_mb ?? null}
              unit="MB"
            />
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">File Limit</CardTitle>
                <CardDescription>Maximum file size allowed for a single upload.</CardDescription>
              </CardHeader>
              <CardContent className="text-2xl font-semibold">
                {currentPlan?.file_size_limit_mb === null ? "Unlimited" : `${currentPlan?.file_size_limit_mb ?? 0} MB`}
              </CardContent>
            </Card>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Features</CardTitle>
            <CardDescription>Enabled and locked capabilities for the current plan.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(featureLabels).map(([feature, label]) => {
              const enabled = currentPlan ? Boolean(currentPlan[feature as PlanFeatureKey]) : false;

              return (
                <div key={feature} className="flex items-center justify-between rounded-md border p-3 text-sm">
                  <span>{label}</span>
                  <span className={enabled ? "text-teal-700" : "text-muted-foreground"}>
                    {enabled ? "Enabled" : "Locked"}
                  </span>
                </div>
              );
            })}
            <div className="rounded-md border p-3 text-sm text-muted-foreground">
              Manual plan switching is available for testing when you have <code>subscription.manage</code>.
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <QuickStat icon={Users} label="Active Users" value={String(usage.activeUsers)} detail={`${usage.pendingInvitations} pending invites`} />
        <QuickStat icon={Building2} label="Companies" value={String(usage.companies)} detail={formatLimitValue(currentPlan?.max_companies ?? null, "max")} />
        <QuickStat icon={HardDriveDownload} label="Storage Used" value={`${usage.storageUsedMb.toFixed(2)} MB`} detail={formatLimitValue(currentPlan?.storage_limit_mb ?? null, "available")} />
        <QuickStat icon={FileStack} label="Single File Limit" value={currentPlan?.file_size_limit_mb === null ? "Unlimited" : `${currentPlan?.file_size_limit_mb} MB`} detail="Per document upload" />
      </div>

      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold">Available Plans</h2>
          <p className="text-sm text-muted-foreground">
            Compare plan limits and features below. Manual switching is for internal testing until billing automation is connected.
          </p>
        </div>
        <div className="grid gap-4 xl:grid-cols-4">
          {plans.map((plan) => (
            <SubscriptionPlanCard
              key={plan.id}
              plan={plan}
              isCurrent={currentPlan?.id === plan.id}
              canManage={canManage}
              featureItems={Object.entries(featureLabels)
                .filter(([feature]) => Boolean(plan[feature as PlanFeatureKey]))
                .map(([, label]) => label)}
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function QuickStat({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{label}</p>
          <p className="mt-2 text-2xl font-semibold">{value}</p>
          <p className="mt-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        <div className="rounded-md bg-slate-100 p-2 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
      </CardContent>
    </Card>
  );
}
