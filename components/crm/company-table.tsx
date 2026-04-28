"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import type React from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { CompanyStatusBadge } from "@/components/crm/company-status-badge";
import { LeadTemperatureBadge } from "@/components/crm/lead-temperature-badge";
import { RatingBadge } from "@/components/crm/rating-badge";
import { archiveCompanyAction } from "@/lib/crm/actions";
import type { Company, CompanyCategory, Industry, PipelineStage, TeamMemberOption } from "@/lib/crm/types";

type CompanyTableProps = {
  companies: Company[];
  industries: Industry[];
  categories: CompanyCategory[];
  stages: PipelineStage[];
  teamMembers: TeamMemberOption[];
};

export function CompanyTable({ companies, industries, categories, stages, teamMembers }: CompanyTableProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value);
      if (text) params.set(key, text);
    }
    router.push(`/companies?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <form action={applyFilters} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 xl:grid-cols-7">
        <InputLike name="search" placeholder="Search leads..." defaultValue={searchParams.get("search") ?? ""} />
        <SelectLike name="industry" defaultValue={searchParams.get("industry") ?? ""} options={industries.map((item) => [item.id, item.name])} label="Industry" />
        <SelectLike name="category" defaultValue={searchParams.get("category") ?? ""} options={categories.map((item) => [item.id, item.name])} label="Category" />
        <SelectLike name="pipeline" defaultValue={searchParams.get("pipeline") ?? ""} options={stages.map((item) => [item.id, item.name])} label="Pipeline" />
        <SelectLike name="priority" defaultValue={searchParams.get("priority") ?? ""} options={[["low", "Low"], ["medium", "Medium"], ["high", "High"], ["urgent", "Urgent"]]} label="Priority" />
        <SelectLike name="temperature" defaultValue={searchParams.get("temperature") ?? ""} options={[["cold", "Cold"], ["warm", "Warm"], ["hot", "Hot"]]} label="Temperature" />
        <SelectLike name="assigned" defaultValue={searchParams.get("assigned") ?? ""} options={teamMembers.map((item) => [item.id, item.full_name ?? item.email])} label="Assigned" />
        <div className="md:col-span-3 xl:col-span-7">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>

      {companies.length === 0 ? (
        <EmptyState
          title="No companies added yet"
          description="Add your first lead or import data later."
          icon={Plus}
          actionLabel="Add Company"
          actionHref="/companies/new"
        />
      ) : (
        <div className="space-y-3 md:hidden">
          {companies.map((company) => (
            <div key={company.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{company.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">
                    Primary: {company.primary_contact?.name ?? "No primary contact"}
                  </p>
                </div>
                <CompanyStatusBadge status={company.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <RatingBadge rating={company.success_rating} />
                <LeadTemperatureBadge temperature={company.lead_temperature} />
              </div>
              <div className="mt-3 flex gap-1">
                <Button asChild size="sm" variant="outline"><Link href={`/companies/${company.id}`}>View</Link></Button>
                <Button asChild size="sm" variant="ghost"><Link href={`/companies/${company.id}/edit`}>Edit</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {companies.length > 0 ? (
        <div className="hidden max-w-full overflow-hidden rounded-lg border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-[18%] px-4 py-3">Company Name</th>
                  <th className="w-[15%] px-4 py-3">Primary Contact</th>
                  <th className="w-[13%] px-4 py-3">Industry</th>
                  <th className="w-[14%] px-4 py-3">Stage</th>
                  <th className="w-[9%] px-4 py-3">Rating</th>
                  <th className="w-[11%] px-4 py-3">Temperature</th>
                  <th className="w-[12%] px-4 py-3">Assigned To</th>
                  <th className="w-[8%] px-4 py-3">Status</th>
                  <th className="w-[10%] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {companies.map((company) => (
                  <tr key={company.id} className="border-b last:border-0">
                    <td className="truncate px-4 py-3 font-medium">{company.name}</td>
                    <td className="truncate px-4 py-3">{company.primary_contact?.name ?? "-"}</td>
                    <td className="truncate px-4 py-3">{company.industries?.name ?? "-"}</td>
                    <td className="truncate px-4 py-3">
                      <span className="inline-flex min-w-0 items-center gap-2">
                        {company.pipeline_stages?.color ? <span className="size-3 shrink-0 rounded-full" style={{ background: company.pipeline_stages.color }} /> : null}
                        <span className="truncate">{company.pipeline_stages?.name ?? "-"}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3"><RatingBadge rating={company.success_rating} /></td>
                    <td className="px-4 py-3"><LeadTemperatureBadge temperature={company.lead_temperature} /></td>
                    <td className="truncate px-4 py-3">{company.assigned_profile?.full_name ?? company.assigned_profile?.email ?? "Unassigned"}</td>
                    <td className="px-4 py-3"><CompanyStatusBadge status={company.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost"><Link href={`/companies/${company.id}`}><Eye /><span className="sr-only">View</span></Link></Button>
                        <Button asChild size="icon" variant="ghost"><Link href={`/companies/${company.id}/edit`}><Edit /><span className="sr-only">Edit</span></Link></Button>
                        <Button size="icon" variant="ghost" onClick={() => setArchiveId(company.id)}><Trash2 /><span className="sr-only">Archive</span></Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ConfirmModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive company"
        description="This removes the company from active lists while preserving activity history."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveCompanyAction(archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
      {isPending ? <p className="text-sm text-muted-foreground">Updating company list...</p> : null}
    </div>
  );
}

function InputLike(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-10 rounded-md border bg-background px-3 text-sm" />;
}

function SelectLike({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][] }) {
  return (
    <select {...props} className="h-10 rounded-md border bg-background px-3 text-sm">
      <option value="">{label}</option>
      {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select>
  );
}
