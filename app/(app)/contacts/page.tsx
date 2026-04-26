import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContactTable } from "@/components/crm/contact-table";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanies, getContacts } from "@/lib/crm/queries";
import type { ContactFilters } from "@/lib/crm/types";

export default async function ContactsPage({ searchParams }: { searchParams: Promise<ContactFilters> }) {
  const filters = await searchParams;
  const [contacts, companies] = await Promise.all([
    getContacts(filters),
    getCompanies({}),
  ]);

  return (
    <div>
      <PageHeader
        title="Contacts"
        description="Manage decision makers, relationship strength, and communication preferences."
        actions={
          <Button asChild>
            <Link href="/contacts/new">
              <Plus />
              Add Contact
            </Link>
          </Button>
        }
      />
      <ContactTable contacts={contacts} companies={companies} />
    </div>
  );
}
