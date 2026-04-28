"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Eye, Plus, CheckCircle2, XCircle, Archive, RotateCcw, CircleHelp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { HelpRequestStatusBadge, HelpRequestPriorityBadge, HelpRequestTypeBadge } from "@/components/crm/help-request-badges";
import { assignHelpRequest, resolveHelpRequest, rejectHelpRequest, reopenHelpRequest, archiveHelpRequest } from "@/lib/crm/help-request-actions";
import { helpRequestTypeOptions, helpRequestPriorityOptions, helpRequestStatusOptions } from "@/lib/crm/schemas";
import type { Company, HelpRequest, TeamMemberOption } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

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
      <form action={applyFilters} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
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
        <div className="md:col-span-3 xl:col-span-6 flex gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/need-help")}>Reset</Button>
        </div>
      </form>

      <div className="flex flex-wrap gap-1 rounded-lg border bg-white p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => applyTabFilter(tab.value)}
            className={cn(
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              currentStatus === tab.value
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filteredRequests.length === 0 ? (
        <div className="space-y-4">
          <EmptyState
            title="No help requests found"
            description="Create a new help request to get support from your team."
            icon={CircleHelp}
            actionLabel="New Help Request"
            actionHref="/need-help/new"
          />
        </div>
      ) : (
        <div className="space-y-3 md:hidden">
          {filteredRequests.map((h) => (
            <div key={h.id} className="rounded-lg border bg-white p-4">
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
              <div className="mt-3 flex gap-1 flex-wrap">
                <Button asChild size="sm" variant="outline"><Link href={`/need-help/${h.id}`}>View</Link></Button>
                {h.status === "open" && (
                  <Button size="sm" onClick={() => { setAssignId(h.id); setAssignee(""); }}>Assign</Button>
                )}
                {h.status === "in_progress" && (
                  <Button size="sm" onClick={() => setResolveId(h.id)}>Resolve</Button>
                )}
                {(h.status === "open" || h.status === "in_progress") && (
                  <Button size="sm" variant="outline" onClick={() => setRejectId(h.id)}>Reject</Button>
                )}
                {(h.status === "resolved" || h.status === "rejected") && (
                  <Button size="sm" variant="outline" onClick={() => setReopenId(h.id)}>Reopen</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {filteredRequests.length > 0 && (
        <div className="hidden max-w-full overflow-hidden rounded-lg border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1200px] table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-[20%] px-4 py-3">Title</th>
                  <th className="w-[15%] px-4 py-3">Company</th>
                  <th className="w-[12%] px-4 py-3">Help Type</th>
                  <th className="w-[8%] px-4 py-3">Priority</th>
                  <th className="w-[10%] px-4 py-3">Requested By</th>
                  <th className="w-[10%] px-4 py-3">Assigned To</th>
                  <th className="w-[10%] px-4 py-3">Status</th>
                  <th className="w-[10%] px-4 py-3">Created</th>
                  <th className="w-[5%] px-4 py-3 text-right">Actions</th>
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
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="View Detail"><Link href={`/need-help/${h.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost" title="Edit"><Link href={`/need-help/${h.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                        {h.status === "open" && (
                          <Button size="icon" variant="ghost" title="Assign" onClick={() => { setAssignId(h.id); setAssignee(""); }}><CheckCircle2 className="h-4 w-4" /></Button>
                        )}
                        {h.status === "in_progress" && (
                          <Button size="icon" variant="ghost" className="text-success hover:text-success hover:bg-success/10" title="Resolve" onClick={() => setResolveId(h.id)}><CheckCircle2 className="h-4 w-4" /></Button>
                        )}
                        {(h.status === "open" || h.status === "in_progress") && (
                          <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Reject" onClick={() => setRejectId(h.id)}><XCircle className="h-4 w-4" /></Button>
                        )}
                        {(h.status === "resolved" || h.status === "rejected") && (
                          <Button size="icon" variant="ghost" title="Reopen" onClick={() => setReopenId(h.id)}><RotateCcw className="h-4 w-4" /></Button>
                        )}
                        {h.status !== "archived" && (
                          <Button size="icon" variant="ghost" title="Archive" onClick={() => setArchiveId(h.id)}><Archive className="h-4 w-4" /></Button>
                        )}
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
            className="mt-2 w-full rounded-md border bg-background px-3 py-2 text-sm"
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
