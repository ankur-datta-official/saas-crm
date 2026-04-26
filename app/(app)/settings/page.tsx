import { BriefcaseBusiness, Building2, KanbanSquare } from "lucide-react";
import { CrmSettingsCard } from "@/components/crm/crm-settings-card";
import { PageHeader } from "@/components/shared/page-header";

export default function SettingsPage() {
  return (
    <div>
      <PageHeader
        title="Settings"
        description="Configure CRM base data, workspace defaults, and sales workflow settings."
      />
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
