import { CalendarClock } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function MeetingsPage() {
  return (
    <ModulePlaceholder
      title="Meetings"
      description="Plan client meetings, discussion notes, outcomes, success ratings, and next steps."
      emptyTitle="Meeting workflows are staged for a future sprint"
      emptyDescription="Calendar, notes, ratings, and attendance models can be added on top of this route."
      icon={CalendarClock}
    />
  );
}
