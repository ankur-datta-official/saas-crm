import { CompanyForm } from "@/components/crm/company-form";
import { PageHeader } from "@/components/shared/page-header";
import { getCompanyFormOptions } from "@/lib/crm/queries";

export default async function NewCompanyPage() {
  const options = await getCompanyFormOptions();

  return (
    <div>
      <PageHeader
        title="Add Company"
        description="Create a new company lead and place it into your CRM pipeline."
      />
      <CompanyForm {...options} />
    </div>
  );
}
