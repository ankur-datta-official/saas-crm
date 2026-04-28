"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { switchSubscriptionPlan } from "@/lib/subscription/subscription-actions";
import type { SubscriptionPlan } from "@/lib/subscription/types";

type SubscriptionPlanCardProps = {
  plan: SubscriptionPlan;
  isCurrent: boolean;
  canManage: boolean;
  featureItems: string[];
};

export function SubscriptionPlanCard({ plan, isCurrent, canManage, featureItems }: SubscriptionPlanCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleSwitch() {
    setError(null);
    startTransition(async () => {
      try {
        await switchSubscriptionPlan(plan.id);
        router.refresh();
      } catch (switchError) {
        setError(switchError instanceof Error ? switchError.message : "Unable to change the plan.");
      }
    });
  }

  return (
    <Card className={isCurrent ? "border-primary shadow-sm" : undefined}>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{plan.name}</CardTitle>
            <CardDescription>{plan.description}</CardDescription>
          </div>
          {isCurrent ? <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary">Current</span> : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-3xl font-semibold">
          {plan.slug === "enterprise" ? "Custom" : `$${Number(plan.monthly_price).toFixed(0)}`}
          <span className="ml-1 text-sm font-normal text-muted-foreground">/month</span>
        </div>
        <div className="space-y-2 text-sm">
          <p>{plan.max_users === null ? "Unlimited users" : `${plan.max_users} users`}</p>
          <p>{plan.max_companies === null ? "Unlimited companies" : `${plan.max_companies.toLocaleString()} companies`}</p>
          <p>{plan.storage_limit_mb === null ? "Unlimited storage" : `${plan.storage_limit_mb.toLocaleString()} MB storage`}</p>
          <p>{plan.file_size_limit_mb === null ? "Unlimited file size" : `${plan.file_size_limit_mb} MB file limit`}</p>
        </div>
        <div className="space-y-2 border-t pt-4 text-sm">
          {featureItems.map((item) => (
            <div key={item} className="flex items-center gap-2 text-muted-foreground">
              <CheckCircle2 className="h-4 w-4 text-teal-600" />
              <span>{item}</span>
            </div>
          ))}
        </div>
        {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {canManage ? (
          <Button type="button" className="w-full" variant={isCurrent ? "outline" : "default"} disabled={isPending || isCurrent} onClick={handleSwitch}>
            {isCurrent ? "Current Plan" : isPending ? "Switching..." : "Switch Plan"}
          </Button>
        ) : (
          <p className="text-sm text-muted-foreground">Manual billing changes are handled by your workspace administrator.</p>
        )}
      </CardContent>
    </Card>
  );
}
