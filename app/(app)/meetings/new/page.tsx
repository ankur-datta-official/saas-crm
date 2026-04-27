import { InteractionForm } from "@/components/crm/interaction-form";
import { PageHeader } from "@/components/shared/page-header";
import { getInteractionFormOptions } from "@/lib/crm/queries";

export default async function NewMeetingPage({ searchParams }: { searchParams: Promise<{ companyId?: string }> }) {
  const [{ companyId }, options] = await Promise.all([searchParams, getInteractionFormOptions()]);
  return (
    <div>
      <PageHeader title="Add Meeting" description="Capture a client meeting, call, demo, or sales interaction." />
      <InteractionForm {...options} defaultCompanyId={companyId} />
    </div>
  );
}
