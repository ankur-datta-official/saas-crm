import { KanbanSquare } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function PipelinePage() {
  return (
    <ModulePlaceholder
      title="Pipeline"
      description="View lead stages, opportunity value, deal movement, and probability signals."
      emptyTitle="Pipeline board foundation is available"
      emptyDescription="Kanban stages, drag-and-drop, and forecasting data can be layered in later."
      icon={KanbanSquare}
    />
  );
}
