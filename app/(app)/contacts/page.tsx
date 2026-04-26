import { Users } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ContactsPage() {
  return (
    <ModulePlaceholder
      title="Contacts"
      description="Track contact persons, stakeholder roles, and communication ownership."
      emptyTitle="Contacts will connect to companies later"
      emptyDescription="This placeholder keeps the navigation and page contract stable before relational data is introduced."
      icon={Users}
    />
  );
}
