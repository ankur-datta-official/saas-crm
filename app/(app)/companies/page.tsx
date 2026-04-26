import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
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
        title="Companies / Leads"
        description="Manage company leads, qualification signals, pipeline stages, and ownership."
        actions={
          <Button asChild>
            <Link href="/companies/new">
              <Plus />
              Add Company
            </Link>
          </Button>
        }
      />
      <CompanyTable companies={companies} {...options} />
    </div>
  );
}
