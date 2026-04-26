import Link from "next/link";
import { Edit } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CompanyStatusBadge } from "@/components/crm/company-status-badge";
import { LeadTemperatureBadge } from "@/components/crm/lead-temperature-badge";
import { RatingBadge } from "@/components/crm/rating-badge";
import type { Company } from "@/lib/crm/types";

export function CompanyProfileHeader({ company }: { company: Company }) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-4 p-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-normal">{company.name}</h1>
            <CompanyStatusBadge status={company.status} />
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-sm text-muted-foreground">
            <span>{company.industries?.name ?? "No industry"}</span>
            <span>/</span>
            <span>{company.company_categories?.name ?? "No category"}</span>
            <span>/</span>
            <span>{company.pipeline_stages?.name ?? "No pipeline stage"}</span>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <RatingBadge rating={company.success_rating} />
            <LeadTemperatureBadge temperature={company.lead_temperature} />
            <span className="rounded-md border px-2.5 py-0.5 text-xs font-medium">
              Assigned: {company.assigned_profile?.full_name ?? company.assigned_profile?.email ?? "Unassigned"}
            </span>
          </div>
        </div>
        <Button asChild>
          <Link href={`/companies/${company.id}/edit`}>
            <Edit />
            Edit Company
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
