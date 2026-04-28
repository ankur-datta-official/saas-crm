"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Plus, CheckCircle2, XCircle, Archive, RotateCcw, CircleHelp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpRequestStatusBadge, HelpRequestPriorityBadge, HelpRequestTypeBadge } from "@/components/crm/help-request-badges";
import { assignHelpRequest, resolveHelpRequest, rejectHelpRequest, reopenHelpRequest, archiveHelpRequest } from "@/lib/crm/help-request-actions";
import { helpRequestTypeOptions, helpRequestPriorityOptions, helpRequestStatusOptions } from "@/lib/crm/schemas";
import type { Company, HelpRequest, TeamMemberOption } from "@/lib/crm/types";
import { cn } from "@/lib/utils";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In Progress" },
  { value: "resolved", label: "Resolved" },
  { value: "rejected", label: "Rejected" },
  { value: "archived", label: "Archived" },
];

export function HelpRequestTable({
  helpRequests,
  companies,
  teamMembers,
}: {
  helpRequests: HelpRequest[];
  companies: Company[];
  teamMembers: TeamMemberOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [assignId, setAssignId] = useState<string | null>(null);
  const [resolveId, setResolveId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [reopenId, setReopenId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);
  const [assignee, setAssignee] = useState<string>("");

  const currentStatus = searchParams.get("status") ?? "all";

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value);
      if (text) params.set(key, text);
    }
    router.push(`/need-help?${params.toString()}`);
  }

  function applyTabFilter(status: string) {
    const params = new URLSearchParams(searchParams);
    if (status === "all") {
      params.delete("status");
    } else {
      params.set("status", status);
    }
    router.push(`/need-help?${params.toString()}`);
  }

  const filteredRequests = currentStatus === "all"
    ? helpRequests
    : helpRequests.filter((h) => h.status === currentStatus);

  return (
    <div className="space-y-4">
      <form action={applyFilters} className="crm-filter-surface grid gap-3 md:grid-cols-3 xl:grid-cols-6">
        <InputLike name="search" placeholder="Search help requests..." defaultValue={searchParams.get("search") ?? ""} />
        <SelectLike
          name="company"
          defaultValue={searchParams.get("company") ?? ""}
          label="Company"
          options={companies.map((c) => [c.id, c.name])}
        />
        <SelectLike
          name="helpType"
          defaultValue={searchParams.get("helpType") ?? ""}
          label="Help Type"
          options={helpRequestTypeOptions.map((t) => [t, t])}
        />
        <SelectLike
          name="priority"
          defaultValue={searchParams.get("priority") ?? ""}
          label="Priority"
          options={helpRequestPriorityOptions.map((p) => [p, p.charAt(0).toUpperCase() + p.slice(1)])}
        />
        <details className="md:col-span-3 xl:col-span-2">
          <summary className="crm-filter-summary">
            More filters
          </summary>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <SelectLike
              name="assignedTo"
              defaultValue={searchParams.get("assignedTo") ?? ""}
              label="Assigned To"
              options={teamMembers.map((m) => [m.id, m.full_name ?? m.email])}
            />
            <SelectLike
              name="requestedBy"
              defaultValue={searchParams.get("requestedBy") ?? ""}
              label="Requested By"
              options={teamMembers.map((m) => [m.id, m.full_name ?? m.email])}
            />
          </div>
        </details>
        <div className="md:col-span-3 xl:col-span-6 flex gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/need-help")}>Reset</Button>
        </div>
      </form>

      <div className="rounded-2xl border border-slate-200 bg-white p-1 shadow-soft">
        <div className="flex flex-wrap gap-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => applyTabFilter(tab.value)}
            className={cn(
              "rounded-xl px-3 py-2 text-sm font-medium transition-colors",
              currentStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
            )}
          >
            {tab.label}
          </button>
        ))}
        </div>
      </div>

      {filteredRequests.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No help requests found"
            description="No support requests yet. Ask for help when a client needs pricing, technical, or management input."
            icon={CircleHelp}
            actionLabel="New Request"
            actionHref="/need-help/new"
          />
        </div>
      ) : (
        <div className="space-y-3 md:hidden">
          {filteredRequests.map((h) => (
            <div key={h.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-soft">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <p className="font-medium truncate">{h.title}</p>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{h.companies?.name}</p>
                </div>
                <HelpRequestStatusBadge status={h.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <HelpRequestTypeBadge type={h.help_type} />
                <HelpRequestPriorityBadge priority={h.priority} />
                <span className="text-xs text-muted-foreground">
                  {new Date(h.created_at).toLocaleDateString()}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button asChild size="sm" variant="outline" className="flex-1"><Link href={`/need-help/${h.id}`}>Open</Link></Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">More actions</span></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem asChild><Link href={`/need-help/${h.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></DropdownMenuItem>
                    {h.status === "open" ? <DropdownMenuItem onClick={() => { setAssignId(h.id); setAssignee(""); }}><CheckCircle2 className="mr-2 h-4 w-4" />Assign</DropdownMenuItem> : null}
                    {h.status === "in_progress" ? <DropdownMenuItem onClick={() => setResolveId(h.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Resolve</DropdownMenuItem> : null}
                    {(h.status === "open" || h.status === "in_progress") ? <DropdownMenuItem onClick={() => setRejectId(h.id)} className="text-rose-600"><XCircle className="mr-2 h-4 w-4" />Reject</DropdownMenuItem> : null}
                    {(h.status === "resolved" || h.status === "rejected") ? <DropdownMenuItem onClick={() => setReopenId(h.id)}><RotateCcw className="mr-2 h-4 w-4" />Reopen</DropdownMenuItem> : null}
                    {h.status !== "archived" ? <DropdownMenuItem onClick={() => setArchiveId(h.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem> : null}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="crm-table-shell hidden max-w-full md:block">
          <div className="overflow-x-auto">
            <table className="crm-table min-w-[980px] table-fixed">
              <thead className="crm-table-head">
                <tr>
                  <th className="w-[20%] px-4 py-3">Title</th>
                  <th className="w-[15%] px-4 py-3">Company</th>
                  <th className="w-[12%] px-4 py-3">Help Type</th>
                  <th className="w-[8%] px-4 py-3">Priority</th>
                  <th className="w-[10%] px-4 py-3">Requested By</th>
                  <th className="w-[12%] px-4 py-3">Assigned To</th>
                  <th className="w-[12%] px-4 py-3">Status</th>
                  <th className="w-[11%] px-4 py-3">Created</th>
                  <th className="w-[8%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((h) => (
                  <tr key={h.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 truncate font-medium">{h.title}</td>
                    <td className="px-4 py-3 truncate">{h.companies?.name}</td>
                    <td className="px-4 py-3"><HelpRequestTypeBadge type={h.help_type} /></td>
                    <td className="px-4 py-3"><HelpRequestPriorityBadge priority={h.priority} /></td>
                    <td className="px-4 py-3 truncate text-muted-foreground">
                      {h.requested_profile?.full_name ?? h.requested_profile?.email ?? "—"}
                    </td>
                    <td className="px-4 py-3 truncate text-muted-foreground">
                      {h.assigned_profile?.full_name ?? h.assigned_profile?.email ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3"><HelpRequestStatusBadge status={h.status} /></td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {new Date(h.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button asChild size="sm" variant="outline"><Link href={`/need-help/${h.id}`}>Open</Link></Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /><span className="sr-only">More actions</span></Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild><Link href={`/need-help/${h.id}/edit`}><Edit className="mr-2 h-4 w-4" />Edit</Link></DropdownMenuItem>
                            {h.status === "open" ? <DropdownMenuItem onClick={() => { setAssignId(h.id); setAssignee(""); }}><CheckCircle2 className="mr-2 h-4 w-4" />Assign</DropdownMenuItem> : null}
                            {h.status === "in_progress" ? <DropdownMenuItem onClick={() => setResolveId(h.id)}><CheckCircle2 className="mr-2 h-4 w-4" />Resolve</DropdownMenuItem> : null}
                            {(h.status === "open" || h.status === "in_progress") ? <DropdownMenuItem onClick={() => setRejectId(h.id)} className="text-rose-600"><XCircle className="mr-2 h-4 w-4" />Reject</DropdownMenuItem> : null}
                            {(h.status === "resolved" || h.status === "rejected") ? <DropdownMenuItem onClick={() => setReopenId(h.id)}><RotateCcw className="mr-2 h-4 w-4" />Reopen</DropdownMenuItem> : null}
                            {h.status !== "archived" ? <DropdownMenuItem onClick={() => setArchiveId(h.id)}><Archive className="mr-2 h-4 w-4" />Archive</DropdownMenuItem> : null}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <ConfirmModal
        open={Boolean(assignId)}
        onOpenChange={(open) => !open && setAssignId(null)}
        title="Assign help request"
        description="Select a team member to assign this help request."
        confirmLabel="Assign"
        onConfirm={() => {
          if (!assignId) return;
          startTransition(async () => {
            await assignHelpRequest(assignId, assignee, true);
            setAssignId(null);
            setAssignee("");
            router.refresh();
          });
        }}
      >
        <div className="py-4">
          <label className="text-sm font-medium">Assign to</label>
          <select
            className="crm-filter-select mt-2"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
          >
            <option value="">Select team member...</option>
            {teamMembers.map((m) => (
              <option key={m.id} value={m.id}>{m.full_name ?? m.email}</option>
            ))}
          </select>
        </div>
      </ConfirmModal>

      <ConfirmModal
        open={Boolean(resolveId)}
        onOpenChange={(open) => !open && setResolveId(null)}
        title="Resolve help request"
        description="Mark this help request as resolved."
        confirmLabel="Resolve"
        onConfirm={() => {
          if (!resolveId) return;
          startTransition(async () => {
            await resolveHelpRequest(resolveId);
            setResolveId(null);
            router.refresh();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(rejectId)}
        onOpenChange={(open) => !open && setRejectId(null)}
        title="Reject help request"
        description="Are you sure you want to reject this help request?"
        confirmLabel="Reject"
        onConfirm={() => {
          if (!rejectId) return;
          startTransition(async () => {
            await rejectHelpRequest(rejectId);
            setRejectId(null);
            router.refresh();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(reopenId)}
        onOpenChange={(open) => !open && setReopenId(null)}
        title="Reopen help request"
        description="Reopen this help request to continue working on it."
        confirmLabel="Reopen"
        onConfirm={() => {
          if (!reopenId) return;
          startTransition(async () => {
            await reopenHelpRequest(reopenId);
            setReopenId(null);
            router.refresh();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive help request"
        description="Archive this help request record. It will be hidden from active lists."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveHelpRequest(archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
    </div>
  );
}

function InputLike(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="crm-filter-input" />;
}

function SelectLike({
  label,
  options,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][] }) {
  return (
    <select {...props} className="crm-filter-select">
      <option value="">{label}</option>
      {options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}
    </select>
  );
}
