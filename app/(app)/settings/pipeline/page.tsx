import { PipelineSettingsManager } from "@/components/crm/settings-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getPipelineStages } from "@/lib/crm/queries";

export default async function PipelineSettingsPage() {
  const stages = await getPipelineStages(true);

  return (
    <div>
      <PageHeader
        title="Pipeline"
        description="Manage pipeline stages, order, colors, probabilities, and won/lost outcomes."
      />
      <PipelineSettingsManager stages={stages} />
    </div>
  );
}
