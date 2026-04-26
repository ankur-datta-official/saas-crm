"use client";

import type React from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";
import { Edit, Eye, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { EmptyState } from "@/components/shared/empty-state";
import { DecisionRoleBadge } from "@/components/crm/decision-role-badge";
import { PrimaryContactBadge } from "@/components/crm/primary-contact-badge";
import { RelationshipLevelBadge } from "@/components/crm/relationship-level-badge";
import { archiveContactAction } from "@/lib/crm/actions";
import { decisionRoleOptions, preferredContactMethodOptions, relationshipLevelOptions } from "@/lib/crm/schemas";
import type { Company, ContactPerson } from "@/lib/crm/types";

export function ContactTable({ contacts, companies }: { contacts: ContactPerson[]; companies: Company[] }) {
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
    router.push(`/contacts?${params.toString()}`);
  }

  return (
    <div className="space-y-4">
      <form action={applyFilters} className="grid gap-3 rounded-lg border bg-white p-4 md:grid-cols-3 xl:grid-cols-6">
        <InputLike name="search" placeholder="Search contacts..." defaultValue={searchParams.get("search") ?? ""} />
        <SelectLike name="company" defaultValue={searchParams.get("company") ?? ""} label="Company" options={companies.map((company) => [company.id, company.name])} />
        <SelectLike name="decisionRole" defaultValue={searchParams.get("decisionRole") ?? ""} label="Decision role" options={decisionRoleOptions.map((item) => [item, item])} />
        <SelectLike name="relationshipLevel" defaultValue={searchParams.get("relationshipLevel") ?? ""} label="Relationship" options={relationshipLevelOptions.map((item) => [item, item])} />
        <SelectLike name="preferredMethod" defaultValue={searchParams.get("preferredMethod") ?? ""} label="Method" options={preferredContactMethodOptions.map((item) => [item, item])} />
        <SelectLike name="status" defaultValue={searchParams.get("status") ?? ""} label="Status" options={[["active", "Active"], ["inactive", "Inactive"]]} />
        <div className="md:col-span-3 xl:col-span-6">
          <Button type="submit">Apply filters</Button>
        </div>
      </form>

      {contacts.length === 0 ? (
        <EmptyState
          title="No contacts added yet"
          description="Add your first decision maker."
          icon={Plus}
        />
      ) : (
        <div className="space-y-3 md:hidden">
          {contacts.map((contact) => (
            <div key={contact.id} className="rounded-lg border bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{contact.name}</p>
                  <p className="mt-1 truncate text-sm text-muted-foreground">{contact.companies?.name ?? "No company"}</p>
                </div>
                <PrimaryContactBadge primary={contact.is_primary} />
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <DecisionRoleBadge role={contact.decision_role} />
                <RelationshipLevelBadge level={contact.relationship_level} />
              </div>
              <div className="mt-3 flex gap-1">
                <Button asChild size="sm" variant="outline"><Link href={`/contacts/${contact.id}`}>View</Link></Button>
                <Button asChild size="sm" variant="ghost"><Link href={`/contacts/${contact.id}/edit`}>Edit</Link></Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {contacts.length > 0 ? (
        <div className="hidden max-w-full overflow-hidden rounded-lg border bg-white md:block">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] table-fixed text-left text-sm">
              <thead className="border-b bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="w-[16%] px-4 py-3">Contact Name</th>
                  <th className="w-[15%] px-4 py-3">Company</th>
                  <th className="w-[13%] px-4 py-3">Designation</th>
                  <th className="w-[12%] px-4 py-3">Decision Role</th>
                  <th className="w-[12%] px-4 py-3">Mobile</th>
                  <th className="w-[16%] px-4 py-3">Email</th>
                  <th className="w-[12%] px-4 py-3">Relationship</th>
                  <th className="w-[9%] px-4 py-3">Primary</th>
                  <th className="w-[10%] px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody>
                {contacts.map((contact) => (
                  <tr key={contact.id} className="border-b last:border-0">
                    <td className="truncate px-4 py-3 font-medium">{contact.name}</td>
                    <td className="truncate px-4 py-3">{contact.companies?.name ?? "-"}</td>
                    <td className="truncate px-4 py-3">{contact.designation ?? "-"}</td>
                    <td className="px-4 py-3"><DecisionRoleBadge role={contact.decision_role} /></td>
                    <td className="truncate px-4 py-3">{contact.mobile ?? "-"}</td>
                    <td className="truncate px-4 py-3">{contact.email ?? "-"}</td>
                    <td className="px-4 py-3"><RelationshipLevelBadge level={contact.relationship_level} /></td>
                    <td className="px-4 py-3"><PrimaryContactBadge primary={contact.is_primary} /></td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <Button asChild size="icon" variant="ghost"><Link href={`/contacts/${contact.id}`}><Eye /><span className="sr-only">View</span></Link></Button>
                        <Button asChild size="icon" variant="ghost"><Link href={`/contacts/${contact.id}/edit`}><Edit /><span className="sr-only">Edit</span></Link></Button>
                        <Button size="icon" variant="ghost" onClick={() => setArchiveId(contact.id)}><Trash2 /><span className="sr-only">Archive</span></Button>
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
        title="Archive contact"
        description="This removes the contact from active lists while preserving activity history."
        confirmLabel="Archive"
        onConfirm={() => {
          if (!archiveId) return;
          startTransition(async () => {
            await archiveContactAction(archiveId);
            setArchiveId(null);
            router.refresh();
          });
        }}
      />
      {isPending ? <p className="text-sm text-muted-foreground">Updating contacts...</p> : null}
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
