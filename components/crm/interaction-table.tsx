"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { InteractionTypeBadge } from "@/components/crm/interaction-type-badge";
import { LeadTemperatureBadge } from "@/components/crm/lead-temperature-badge";
import { RatingBadge } from "@/components/crm/rating-badge";
import { archiveInteractionAction } from "@/lib/crm/actions";
import { interactionTypeOptions } from "@/lib/crm/schemas";
import type { Company, ContactPerson, Interaction } from "@/lib/crm/types";

export function InteractionTable({ interactions, companies, contacts }: { interactions: Interaction[]; companies: Company[]; contacts: ContactPerson[] }) {
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
    router.push(`/meetings?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <form action={applyFilters} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <InputLike name="search" placeholder="Search discussions..." defaultValue={searchParams.get("search") ?? ""} />
        <SelectLike name="company" label="Company" defaultValue={searchParams.get("company") ?? ""} options={companies.map((item) => [item.id, item.name])} />
        <SelectLike name="contact" label="Contact" defaultValue={searchParams.get("contact") ?? ""} options={contacts.map((item) => [item.id, item.name])} />
        <SelectLike name="type" label="Type" defaultValue={searchParams.get("type") ?? ""} options={interactionTypeOptions.map((item) => [item, item])} />
        <SelectLike name="temperature" label="Temperature" defaultValue={searchParams.get("temperature") ?? ""} options={[["cold", "Cold"], ["warm", "Warm"], ["hot", "Hot"], ["very_hot", "Very Hot"]]} />
        <SelectLike name="status" label="Status" defaultValue={searchParams.get("status") ?? ""} options={[["active", "Active"], ["inactive", "Inactive"]]} />
        <InputLike name="ratingMin" type="number" placeholder="Min rating" defaultValue={searchParams.get("ratingMin") ?? ""} />
        <InputLike name="ratingMax" type="number" placeholder="Max rating" defaultValue={searchParams.get("ratingMax") ?? ""} />
        <InputLike name="dateFrom" type="date" defaultValue={searchParams.get("dateFrom") ?? ""} />
        <InputLike name="dateTo" type="date" defaultValue={searchParams.get("dateTo") ?? ""} />
        <div className="md:col-span-3 xl:col-span-6"><Button type="submit">Apply filters</Button></div>
      </form>

      {interactions.length === 0 ? (
        <EmptyState title="No meeting history yet" description="Add your first client interaction to start tracking progress." icon={Plus} actionLabel="Add Meeting" actionHref="/meetings/new" />
      ) : (
        <div className="space-y-3 md:hidden">
          {interactions.map((item) => (
            <div key={item.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3"><p className="font-medium">{item.companies?.name}</p><InteractionTypeBadge type={item.interaction_type} /></div>
              <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{item.discussion_details}</p>
              <div className="mt-3 flex flex-wrap gap-2"><RatingBadge rating={item.success_rating} />{item.lead_temperature ? <LeadTemperatureBadge temperature={item.lead_temperature} /> : null}</div>
              <div className="mt-3 flex gap-1"><Button asChild size="sm" variant="outline"><Link href={`/meetings/${item.id}`}>View</Link></Button><Button asChild size="sm" variant="ghost"><Link href={`/meetings/${item.id}/edit`}>Edit</Link></Button></div>
            </div>
          ))}
        </div>
      )}

      {interactions.length > 0 ? (
        <div className="hidden max-w-full overflow-hidden rounded-lg border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground"><tr>
                <th className="w-[12%] px-4 py-3">Date</th><th className="w-[14%] px-4 py-3">Company</th><th className="w-[12%] px-4 py-3">Contact</th><th className="w-[12%] px-4 py-3">Type</th><th className="w-[20%] px-4 py-3">Discussion Summary</th><th className="w-[8%] px-4 py-3">Rating</th><th className="w-[9%] px-4 py-3">Temp</th><th className="w-[10%] px-4 py-3">Next</th><th className="w-[10%] px-4 py-3">Follow-up</th><th className="w-[9%] px-4 py-3">Actions</th>
              </tr></thead>
              <tbody>{interactions.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="truncate px-4 py-3">{new Date(item.meeting_datetime).toLocaleDateString()}</td>
                  <td className="truncate px-4 py-3">{item.companies?.name ?? "-"}</td>
                  <td className="truncate px-4 py-3">{item.contact_persons?.name ?? "-"}</td>
                  <td className="px-4 py-3"><InteractionTypeBadge type={item.interaction_type} /></td>
                  <td className="truncate px-4 py-3">{item.discussion_details}</td>
                  <td className="px-4 py-3"><RatingBadge rating={item.success_rating} /></td>
                  <td className="px-4 py-3">{item.lead_temperature ? <LeadTemperatureBadge temperature={item.lead_temperature} /> : "-"}</td>
                  <td className="truncate px-4 py-3">{item.next_action ?? "-"}</td>
                  <td className="truncate px-4 py-3">{item.next_followup_at ? new Date(item.next_followup_at).toLocaleDateString() : "-"}</td>
                  <td className="px-4 py-3"><div className="flex gap-1"><Button asChild size="icon" variant="ghost"><Link href={`/meetings/${item.id}`}><Eye /><span className="sr-only">View</span></Link></Button><Button asChild size="icon" variant="ghost"><Link href={`/meetings/${item.id}/edit`}><Edit /><span className="sr-only">Edit</span></Link></Button><Button size="icon" variant="ghost" onClick={() => setArchiveId(item.id)}><Trash2 /><span className="sr-only">Archive</span></Button></div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </div>
      ) : null}

      <ConfirmModal open={Boolean(archiveId)} onOpenChange={(open) => !open && setArchiveId(null)} title="Archive meeting" description="This removes the interaction from active meeting history." confirmLabel="Archive" onConfirm={() => { if (!archiveId) return; startTransition(async () => { await archiveInteractionAction(archiveId); setArchiveId(null); router.refresh(); }); }} />
      {isPending ? <p className="text-sm text-muted-foreground">Updating meetings...</p> : null}
    </div>
  );
}

function InputLike(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className="h-10 rounded-md border bg-background px-3 text-sm" />;
}
function SelectLike({ label, options, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; options: string[][] }) {
  return <select {...props} className="h-10 rounded-md border bg-background px-3 text-sm"><option value="">{label}</option>{options.map(([value, name]) => <option key={value} value={value}>{name}</option>)}</select>;
}
