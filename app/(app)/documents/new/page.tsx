import { PageHeader } from "@/components/shared/page-header";
import { DocumentForm } from "@/components/crm/document-form";
import { getDocumentFormOptions } from "@/lib/crm/queries";
import { FileText } from "lucide-react";

export const metadata = {
  title: "Upload Document | CRM",
};

type PageProps = {
  searchParams: Promise<{
    companyId?: string;
    contactId?: string;
    interactionId?: string;
    followupId?: string;
  }>;
};

export default async function NewDocumentPage({ searchParams }: PageProps) {
  const { 
    companyId, 
    contactId, 
    interactionId, 
    followupId 
  } = await searchParams;
  
  const options = await getDocumentFormOptions();

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <PageHeader
        title="Upload Document"
        description="Add a new document to the CRM and link it to a company or interaction."
      />

      <DocumentForm 
        {...options} 
        initialCompanyId={companyId}
        initialContactId={contactId}
        initialInteractionId={interactionId}
        initialFollowupId={followupId}
      />
    </div>
  );
}
