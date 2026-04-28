import { BriefcaseBusiness, Building2, KanbanSquare } from "lucide-react";
import { CrmSettingsCard } from "@/components/crm/crm-settings-card";
import { PageHeader } from "@/components/shared/page-header";
import { GuidanceStrip } from "@/components/shared/guidance-strip";
import { requireAnyPermission } from "@/lib/auth/session";

export default async function SettingsPage() {
  await requireAnyPermission(["settings.view", "settings.manage"]);

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure CRM base data, workspace defaults, and sales workflow settings."
      />
      <GuidanceStrip>
        Update the base labels and pipeline stages here so your team sees the right options everywhere else in the CRM.
      </GuidanceStrip>
      <div className="grid gap-4 lg:grid-cols-3">
        <CrmSettingsCard
          title="Industries"
          description="Manage industry labels for company lead segmentation."
          href="/settings/industries"
          icon={BriefcaseBusiness}
        />
        <CrmSettingsCard
          title="Company Categories"
          description="Manage value tiers and prioritization categories."
          href="/settings/company-categories"
          icon={Building2}
        />
        <CrmSettingsCard
          title="Pipeline"
          description="Customize pipeline stages, colors, order, and probabilities."
          href="/settings/pipeline"
          icon={KanbanSquare}
        />
      </div>
    </div>
  );
}
