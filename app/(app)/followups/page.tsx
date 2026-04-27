import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";
import { FollowupTable } from "@/components/crm/followup-table";
import { getFollowups } from "@/lib/crm/followup-queries";
import { getCompanies, getTeamMembers } from "@/lib/crm/queries";
import type { FollowupFilters } from "@/lib/crm/types";

export default async function FollowupsPage({
  searchParams,
}: {
  searchParams: Promise<FollowupFilters>;
}) {
  const filters = await searchParams;

  return (
    <div className="container py-6">
      <PageHeader
        title="Follow-ups"
        description="Manage your scheduled actions and reminders."
        actions={
          <Button asChild>
            <Link href="/followups/new">
              <Plus className="mr-2 h-4 w-4" />
              New Follow-up
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton />}>
        <FollowupsList filters={filters} />
      </Suspense>
    </div>
  );
}

async function FollowupsList({ filters }: { filters: FollowupFilters }) {
  const [followups, companies, teamMembers] = await Promise.all([
    getFollowups(filters),
    getCompanies({}),
    getTeamMembers(),
  ]);

  return <FollowupTable followups={followups} companies={companies} teamMembers={teamMembers} />;
}
