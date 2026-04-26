import { CircleHelp } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function NeedHelpPage() {
  return (
    <ModulePlaceholder
      title="Need Help"
      description="Surface blocked deals, internal support requests, and escalation needs."
      emptyTitle="Help escalation queue is not implemented yet"
      emptyDescription="The route is reserved for team requests, blockers, and manager review workflows."
      icon={CircleHelp}
    />
  );
}
