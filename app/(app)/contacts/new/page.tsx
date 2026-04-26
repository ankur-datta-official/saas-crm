import { ContactForm } from "@/components/crm/contact-form";
import { PageHeader } from "@/components/shared/page-header";
import { getContactFormOptions } from "@/lib/crm/queries";

export default async function NewContactPage({
  searchParams,
}: {
  searchParams: Promise<{ companyId?: string }>;
}) {
  const [{ companyId }, options] = await Promise.all([
    searchParams,
    getContactFormOptions(),
  ]);

  return (
    <div>
      <PageHeader
        title="Add Contact"
        description="Create a contact person for a company lead."
      />
      <ContactForm companies={options.companies} defaultCompanyId={companyId} />
    </div>
  );
}
