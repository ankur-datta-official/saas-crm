import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GuidanceStrip } from "@/components/shared/guidance-strip";
import { CompanyTable } from "@/components/crm/company-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanies, getCompanyFormOptions } from "@/lib/crm/queries";
import type { CompanyFilters } from "@/lib/crm/types";

export default async function CompaniesPage({
  searchParams,
}: {
  searchParams: Promise<CompanyFilters>;
}) {
  const filters = await searchParams;
  const [companies, options] = await Promise.all([
    getCompanies(filters),
    getCompanyFormOptions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Companies & Leads"
        description="Track every prospect, buyer, and relationship from one place."
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus />
              Add Company
            </Link>
          </Button>
        }
      />
      <GuidanceStrip dismissible storageKey="crm-tip-companies">
        Start by adding a company, then attach contacts, meetings, and follow-ups as the relationship grows.
      </GuidanceStrip>
      <CompanyTable companies={companies} {...options} />
    </div>
  );
}
