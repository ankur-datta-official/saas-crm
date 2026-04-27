import { notFound } from "next/navigation";
import Link from "next/link";
import { Building2, CalendarClock, FileText, Handshake, LifeBuoy, NotebookTabs, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyProfileHeader } from "@/components/crm/company-profile-header";
import { ContactProfileCard } from "@/components/crm/contact-profile-card";
import { InteractionTimelineCard } from "@/components/crm/interaction-timeline-card";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { getCompanyById, getContactsByCompany, getInteractionsByCompany } from "@/lib/crm/queries";
import { formatCurrency } from "@/lib/crm/utils";

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [company, contacts, interactions] = await Promise.all([
    getCompanyById(id),
    getContactsByCompany(id),
    getInteractionsByCompany(id),
  ]);

  if (!company) {
    notFound();
  }

  return (
    <div className="space-y-5">
      <CompanyProfileHeader company={company} />
      <section className="grid gap-4 md:grid-cols-3">
        <StatCard title="Estimated Value" value={formatCurrency(company.estimated_value)} icon={Building2} tone="teal" />
        <StatCard title="Success Rating" value={company.success_rating ? `${company.success_rating}/10` : "Not rated"} icon={NotebookTabs} tone="amber" />
        <StatCard title="Lead Temperature" value={company.lead_temperature} icon={Handshake} tone={company.lead_temperature === "hot" ? "rose" : "blue"} />
      </section>
      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Base company profile information for this sprint.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Info label="Email" value={company.email} />
          <Info label="Phone" value={company.phone} />
          <Info label="WhatsApp" value={company.whatsapp} />
          <Info label="Website" value={company.website} />
          <Info label="Address" value={[company.address, company.city, company.country].filter(Boolean).join(", ")} />
          <Info label="Lead source" value={company.lead_source} />
          <Info label="Priority" value={company.priority} />
          <Info label="Expected closing date" value={company.expected_closing_date} />
          <Info
            label="Primary contact"
            value={company.primary_contact ? `${company.primary_contact.name}${company.primary_contact.mobile ? ` - ${company.primary_contact.mobile}` : ""}` : null}
          />
          <div className="md:col-span-2">
            <Info label="Notes" value={company.notes} />
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Contacts</CardTitle>
            <CardDescription>Decision makers and communication points for this company.</CardDescription>
          </div>
          <Button asChild>
            <Link href={`/contacts/new?companyId=${company.id}`}>Add Contact</Link>
          </Button>
        </CardHeader>
        <CardContent>
          {contacts.length === 0 ? (
            <EmptyState
              title="No contact persons added yet"
              description="Add decision makers and communication points for this company."
              icon={Users}
            />
          ) : (
            <div className="space-y-3">
              {contacts.map((contact) => <ContactProfileCard key={contact.id} contact={contact} />)}
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <CardTitle>Meetings</CardTitle>
            <CardDescription>Calls, meetings, demos, and sales interaction history.</CardDescription>
          </div>
          <Button asChild><Link href={`/meetings/new?companyId=${company.id}`}>Add Meeting</Link></Button>
        </CardHeader>
        <CardContent>
          {interactions.length === 0 ? (
            <EmptyState title="No meeting history yet" description="Add your first client interaction to start tracking progress." icon={CalendarClock} />
          ) : (
            <div className="space-y-3">{interactions.map((interaction) => <InteractionTimelineCard key={interaction.id} interaction={interaction} />)}</div>
          )}
        </CardContent>
      </Card>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EmptyState title="Follow-ups" description="Follow-up workflows are intentionally deferred." icon={Handshake} />
        <EmptyState title="Documents" description="Document uploads and submissions are not built yet." icon={FileText} />
        <EmptyState title="Need Help" description="Escalation workflows will be added in a later sprint." icon={LifeBuoy} />
        <EmptyState title="Activity Log" description="Audit records are being captured and can be surfaced later." icon={NotebookTabs} />
      </section>
    </div>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm">{value || "-"}</p>
    </div>
  );
}
