import { notFound } from "next/navigation";
import { Building2, CalendarClock, FileText, Handshake, LifeBuoy, NotebookTabs, Users } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CompanyProfileHeader } from "@/components/crm/company-profile-header";
import { EmptyState } from "@/components/shared/empty-state";
import { StatCard } from "@/components/shared/stat-card";
import { getCompanyById } from "@/lib/crm/queries";
import { formatCurrency } from "@/lib/crm/utils";

export default async function CompanyProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const company = await getCompanyById(id);

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
          <div className="md:col-span-2">
            <Info label="Notes" value={company.notes} />
          </div>
        </CardContent>
      </Card>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <EmptyState title="Contacts" description="Contact person CRUD is planned for a future sprint." icon={Users} />
        <EmptyState title="Meetings" description="Meeting history and notes will connect later." icon={CalendarClock} />
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
