import { ShieldCheck } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function TeamPage() {
  return (
    <ModulePlaceholder
      title="Team"
      description="Manage team members, roles, permissions, and workspace-level collaboration."
      emptyTitle="Team management is prepared"
      emptyDescription="Role-based access, invitations, and member performance views are deferred to later sprints."
      icon={ShieldCheck}
    />
  );
}
