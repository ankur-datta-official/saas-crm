import { notFound } from "next/navigation";
import { ContactForm } from "@/components/crm/contact-form";
import { PageHeader } from "@/components/shared/page-header";
import { getContactById, getContactFormOptions } from "@/lib/crm/queries";

export default async function EditContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [contact, options] = await Promise.all([
    getContactById(id),
    getContactFormOptions(),
  ]);

  if (!contact) {
    notFound();
  }

  return (
    <div>
      <PageHeader
        title="Edit Contact"
        description="Update contact details, relationship role, and communication preference."
      />
      <ContactForm contact={contact} companies={options.companies} />
    </div>
  );
}
