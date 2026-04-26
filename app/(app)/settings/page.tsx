import { Settings } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function SettingsPage() {
  return (
    <ModulePlaceholder
      title="Settings"
      description="Configure workspace profile, CRM defaults, security preferences, and integrations."
      emptyTitle="Settings foundation is in place"
      emptyDescription="Workspace preferences and admin controls can be added without changing the app shell."
      icon={Settings}
    />
  );
}
