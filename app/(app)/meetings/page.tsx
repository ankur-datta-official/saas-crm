import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { InteractionTable } from "@/components/crm/interaction-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanies, getContacts, getInteractions } from "@/lib/crm/queries";
import type { InteractionFilters } from "@/lib/crm/types";

export default async function MeetingsPage({ searchParams }: { searchParams: Promise<InteractionFilters> }) {
  const filters = await searchParams;
  const [interactions, companies, contacts] = await Promise.all([
    getInteractions(filters),
    getCompanies({}),
    getContacts({}),
  ]);

  return (
    <div>
      <PageHeader
        title="Meetings"
        description="Log client calls, meetings, demos, and sales interactions."
        actions={<Button asChild><Link href="/meetings/new"><Plus />Add Meeting</Link></Button>}
      />
      <InteractionTable interactions={interactions} companies={companies} contacts={contacts} />
    </div>
  );
}
