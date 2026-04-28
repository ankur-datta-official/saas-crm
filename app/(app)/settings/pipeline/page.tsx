import { PipelineSettingsManager } from "@/components/crm/settings-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getPipelineStages } from "@/lib/crm/queries";
import { requirePermission } from "@/lib/auth/session";
import { getUpgradeMessage, hasFeature } from "@/lib/subscription/subscription-queries";

export default async function PipelineSettingsPage() {
  await requirePermission("settings.manage");
  const [stages, canCustomize] = await Promise.all([
    getPipelineStages(true),
    hasFeature("custom_pipeline"),
  ]);

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Manage pipeline stages, order, colors, probabilities, and won/lost outcomes."
      />
      <PipelineSettingsManager
        stages={stages}
        canCustomize={canCustomize}
        upgradeMessage={canCustomize ? undefined : getUpgradeMessage("custom_pipeline")}
      />
    </div>
  );
}
