import { IndustrySettingsManager } from "@/components/crm/settings-manager";
import { PageHeader } from "@/components/shared/page-header";
import { getIndustries } from "@/lib/crm/queries";

export default async function IndustriesSettingsPage() {
  const industries = await getIndustries(true);

  return (
    <div>
      <PageHeader
        title="Industries"
        description="Add, edit, and archive industry options used when creating company leads."
      />
      <IndustrySettingsManager industries={industries} />
    </div>
  );
}
