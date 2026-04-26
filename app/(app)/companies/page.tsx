import { Building2 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function CompaniesPage() {
  return (
    <ModulePlaceholder
      title="Companies / Leads"
      description="Manage lead companies, qualification status, ownership, and relationship context."
      emptyTitle="Company CRM module is ready for Sprint 2"
      emptyDescription="The page shell is in place. CRUD, tables, filters, and Supabase-backed tenant data can plug in next."
      icon={Building2}
    />
  );
}
