import { Handshake } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function FollowupsPage() {
  return (
    <ModulePlaceholder
      title="Follow-ups"
      description="Monitor upcoming, completed, and missed follow-up actions across the team."
      emptyTitle="Follow-up tracking shell is ready"
      emptyDescription="Task queues, reminders, due dates, and ownership rules can be introduced without changing navigation."
      icon={Handshake}
    />
  );
}
