import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { HelpRequestTable } from "@/components/crm/help-request-table";
import { getHelpRequests } from "@/lib/crm/help-request-queries";
import { getCompanies, getTeamMembers } from "@/lib/crm/queries";
import type { HelpRequestFilters } from "@/lib/crm/types";

export default async function NeedHelpPage({
  searchParams,
}: {
  searchParams: Promise<HelpRequestFilters>;
}) {
  const filters = await searchParams;

  return (
    <div className="container py-6">
      <PageHeader
        title="Need Help"
        description="Surface blocked deals, internal support requests, and escalation needs."
        actions={
          <Button asChild>
            <Link href="/need-help/new">
              <Plus className="mr-2 h-4 w-4" />
              New Help Request
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton />}>
        <HelpRequestsList filters={filters} />
      </Suspense>
    </div>
  );
}

async function HelpRequestsList({ filters }: { filters: HelpRequestFilters }) {
  const [helpRequests, companies, teamMembers] = await Promise.all([
    getHelpRequests(filters),
    getCompanies({}),
    getTeamMembers(),
  ]);

  return <HelpRequestTable helpRequests={helpRequests} companies={companies} teamMembers={teamMembers} />;
}