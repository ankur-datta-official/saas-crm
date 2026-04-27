"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Eye, Plus, CheckCircle2, XCircle, Archive, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { FollowupStatusBadge, FollowupPriorityBadge, FollowupTypeBadge } from "@/components/crm/followup-badges";
import { completeFollowup, cancelFollowup, archiveFollowup } from "@/lib/crm/followup-actions";
import { followupTypeOptions, followupPriorityOptions, followupStatusOptions } from "@/lib/crm/schemas";
import type { Company, Followup, TeamMemberOption } from "@/lib/crm/types";
import { cn } from "@/lib/utils";

export function FollowupTable({
  followups,
  companies,
  teamMembers,
}: {
  followups: Followup[];
  companies: Company[];
  teamMembers: TeamMemberOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [completeId, setCompleteId] = useState<string | null>(null);
  const [cancelId, setCancelId] = useState<string | null>(null);
  const [archiveId, setArchiveId] = useState<string | null>(null);

  function applyFilters(formData: FormData) {
    const params = new URLSearchParams();
    for (const [key, value] of formData.entries()) {
      const text = String(value);
      if (text) params.set(key, text);
    }
    router.push(`/followups?${params.toString()}`);
  }

  const isOverdue = (followup: Followup) => {
    return followup.status === "pending" && new Date(followup.scheduled_at) < new Date();
  };

  return (
    <div className="space-y-4">
      <form action={applyFilters} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <InputLike name="search" placeholder="Search follow-ups..." defaultValue={searchParams.get("search") ?? ""} />
        <SelectLike
          name="company"
          defaultValue={searchParams.get("company") ?? ""}
          label="Company"
          options={companies.map((c) => [c.id, c.name])}
        />
        <SelectLike
          name="type"
          defaultValue={searchParams.get("type") ?? ""}
          label="Type"
          options={followupTypeOptions.map((t) => [t, t])}
        />
        <SelectLike
          name="priority"
          defaultValue={searchParams.get("priority") ?? ""}
          label="Priority"
          options={followupPriorityOptions.map((p) => [p, p.charAt(0).toUpperCase() + p.slice(1)])}
        />
        <SelectLike
          name="status"
          defaultValue={searchParams.get("status") ?? ""}
          label="Status"
          options={followupStatusOptions.map((s) => [s, s.charAt(0).toUpperCase() + s.slice(1)])}
        />
        <SelectLike
          name="assigned"
          defaultValue={searchParams.get("assigned") ?? ""}
          label="Assigned"
          options={teamMembers.map((m) => [m.id, m.full_name ?? m.email])}
        />
        <div className="md:col-span-3 xl:col-span-6 flex gap-2">
          <Button type="submit">Apply filters</Button>
          <Button type="button" variant="outline" onClick={() => router.push("/followups")}>Reset</Button>
        </div>
      </form>

      {followups.length === 0 ? (
        <EmptyState title="No follow-ups found" description="Schedule a new follow-up to keep the momentum." icon={Calendar} />
      ) : (
        <div className="space-y-3 md:hidden">
          {followups.map((f) => (
            <div key={f.id} className={cn("rounded-lg border bg-white p-4", isOverdue(f) && "border-destructive/30 bg-destructive/5")}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium truncate">{f.title}</p>
                    {isOverdue(f) && <span className="text-[10px] font-bold text-destructive uppercase">Overdue</span>}
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground truncate">{f.companies?.name}</p>
                </div>
                <FollowupStatusBadge status={f.status} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <FollowupTypeBadge type={f.followup_type} />
                <FollowupPriorityBadge priority={f.priority} />
                <span className="text-xs text-muted-foreground flex items-center">
                  <Calendar className="mr-1 h-3 w-3" />
                  {new Date(f.scheduled_at).toLocaleString()}
                </span>
              </div>
              <div className="mt-3 flex gap-1">
                <Button asChild size="sm" variant="outline"><Link href={`/followups/${f.id}`}>View</Link></Button>
                {f.status === "pending" && (
                  <Button size="sm" onClick={() => setCompleteId(f.id)}>Complete</Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {followups.length > 0 && (
        <div className="hidden max-w-full overflow-hidden rounded-lg border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px] table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-[15%] px-4 py-3">Scheduled</th>
                  <th className="w-[20%] px-4 py-3">Title</th>
                  <th className="w-[15%] px-4 py-3">Company</th>
                  <th className="w-[12%] px-4 py-3">Type</th>
                  <th className="w-[10%] px-4 py-3">Priority</th>
                  <th className="w-[10%] px-4 py-3">Assigned To</th>
                  <th className="w-[10%] px-4 py-3">Status</th>
                  <th className="w-[8%] px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {followups.map((f) => (
                  <tr key={f.id} className={cn("border-b last:border-0 hover:bg-muted/30 transition-colors", isOverdue(f) && "bg-destructive/5")}>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={cn("font-medium", isOverdue(f) && "text-destructive")}>
                          {new Date(f.scheduled_at).toLocaleDateString()}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(f.scheduled_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 truncate font-medium">{f.title}</td>
                    <td className="px-4 py-3 truncate">{f.companies?.name}</td>
                    <td className="px-4 py-3"><FollowupTypeBadge type={f.followup_type} /></td>
                    <td className="px-4 py-3"><FollowupPriorityBadge priority={f.priority} /></td>
                    <td className="px-4 py-3 truncate text-muted-foreground">
                      {f.assigned_profile?.full_name ?? f.assigned_profile?.email ?? "Unassigned"}
                    </td>
                    <td className="px-4 py-3"><FollowupStatusBadge status={f.status} /></td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" title="View Detail"><Link href={`/followups/${f.id}`}><Eye className="h-4 w-4" /></Link></Button>
                        <Button asChild size="icon" variant="ghost" title="Edit"><Link href={`/followups/${f.id}/edit`}><Edit className="h-4 w-4" /></Link></Button>
                        {f.status === "pending" && (
                          <>
                            <Button size="icon" variant="ghost" className="text-success hover:text-success hover:bg-success/10" title="Mark Complete" onClick={() => setCompleteId(f.id)}><CheckCircle2 className="h-4 w-4" /></Button>
                            <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive hover:bg-destructive/10" title="Cancel" onClick={() => setCancelId(f.id)}><XCircle className="h-4 w-4" /></Button>
                          </>
                        )}
                        {f.status !== "archived" && (
                          <Button size="icon" variant="ghost" title="Archive" onClick={() => setArchiveId(f.id)}><Archive className="h-4 w-4" /></Button>
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
        open={Boolean(completeId)}
        onOpenChange={(open) => !open && setCompleteId(null)}
        title="Complete follow-up"
        description="Mark this follow-up as successfully completed."
        confirmLabel="Complete"
        onConfirm={() => {
          if (!completeId) return;
          startTransition(async () => {
            await completeFollowup(completeId);
            setCompleteId(null);
            router.refresh();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(cancelId)}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Cancel follow-up"
        description="Are you sure you want to cancel this follow-up?"
        confirmLabel="Cancel Follow-up"
        onConfirm={() => {
          if (!cancelId) return;
          startTransition(async () => {
            await cancelFollowup(cancelId);
            setCancelId(null);
            router.refresh();
          });
        }}
      />

      <ConfirmModal
        open={Boolean(archiveId)}
        onOpenChange={(open) => !open && setArchiveId(null)}
        title="Archive follow-up"
        description="Archive this follow-up record. It will be hidden from active lists."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveFollowup(archiveId);
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
