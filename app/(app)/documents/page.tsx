import { Suspense } from "react";
import Link from "next/link";
import { Plus, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { DocumentTable } from "@/components/crm/document-table";
import { getDocuments } from "@/lib/crm/document-queries";
import { getCompanies, getTeamMembers } from "@/lib/crm/queries";
import { LoadingSkeleton } from "@/components/shared/loading-skeleton";

export const metadata = {
  title: "Documents | CRM",
};

type PageProps = {
  searchParams: Promise<{
    search?: string;
    company?: string;
    type?: string;
    status?: string;
    uploadedBy?: string;
    dateFrom?: string;
    dateTo?: string;
  }>;
};

export default async function DocumentsPage({ searchParams }: PageProps) {
  const filters = await searchParams;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Documents"
        description="Manage company profiles, quotations, proposals, and other business documents."
        actions={
          <Button asChild>
            <Link href="/documents/new">
              <Plus className="w-4 h-4 mr-2" />
              Upload Document
            </Link>
          </Button>
        }
      />

      <Suspense fallback={<LoadingSkeleton rows={5} />}>
        <DocumentListContainer filters={filters} />
      </Suspense>
    </div>
  );
}

async function DocumentListContainer({ filters }: { filters: any }) {
  const [documents, companies, teamMembers] = await Promise.all([
    getDocuments(filters),
    getCompanies({}),
    getTeamMembers(),
  ]);

  return (
    <DocumentTable 
      documents={documents} 
      companies={companies} 
      teamMembers={teamMembers} 
    />
  );
}
