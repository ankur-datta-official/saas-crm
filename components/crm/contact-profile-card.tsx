"use client";

import Link from "next/link";
import { Mail, Pencil, Phone, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { DecisionRoleBadge } from "@/components/crm/decision-role-badge";
import { PrimaryContactBadge } from "@/components/crm/primary-contact-badge";
import { RelationshipLevelBadge } from "@/components/crm/relationship-level-badge";
import { archiveContactAction, setPrimaryContactAction } from "@/lib/crm/actions";
import type { ContactPerson } from "@/lib/crm/types";

export function ContactProfileCard({ contact }: { contact: ContactPerson }) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  return (
    <Card className={contact.is_primary ? "border-primary/50" : undefined}>
      <CardContent className="p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link href={`/contacts/${contact.id}`} className="font-semibold hover:text-primary">{contact.name}</Link>
              <PrimaryContactBadge primary={contact.is_primary} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{contact.designation ?? "No designation"}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <DecisionRoleBadge role={contact.decision_role} />
              <RelationshipLevelBadge level={contact.relationship_level} />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {contact.mobile ? <Button asChild size="icon" variant="outline"><a href={`tel:${contact.mobile}`}><Phone /><span className="sr-only">Call</span></a></Button> : null}
            {contact.email ? <Button asChild size="icon" variant="outline"><a href={`mailto:${contact.email}`}><Mail /><span className="sr-only">Email</span></a></Button> : null}
            {!contact.is_primary ? (
              <Button size="icon" variant="outline" disabled={isPending} onClick={() => startTransition(async () => { await setPrimaryContactAction(contact.id); router.refresh(); })}>
                <Star />
                <span className="sr-only">Set primary</span>
              </Button>
            ) : null}
            <Button asChild size="icon" variant="ghost"><Link href={`/contacts/${contact.id}/edit`}><Pencil /><span className="sr-only">Edit</span></Link></Button>
            <Button size="icon" variant="ghost" onClick={() => setConfirmOpen(true)}><Trash2 /><span className="sr-only">Archive</span></Button>
          </div>
        </div>
        <div className="mt-4 grid gap-2 text-sm text-muted-foreground sm:grid-cols-3">
          <span>Mobile: {contact.mobile ?? "-"}</span>
          <span>WhatsApp: {contact.whatsapp ?? "-"}</span>
          <span>Preferred: {contact.preferred_contact_method ?? "-"}</span>
        </div>
      </CardContent>
      <ConfirmModal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Archive contact"
        description="This removes the contact from active views while preserving audit history."
        confirmLabel="Archive"
        onConfirm={() => startTransition(async () => {
          await archiveContactAction(contact.id);
          setConfirmOpen(false);
          router.refresh();
        })}
      />
    </Card>
  );
}
