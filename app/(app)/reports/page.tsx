import { BarChart3 } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function ReportsPage() {
  return (
    <ModulePlaceholder
      title="Reports"
      description="Analyze CRM activity, lead conversion, meetings, follow-ups, and team performance."
      emptyTitle="Reporting workspace is ready for metrics"
      emptyDescription="TanStack Table, Recharts, and Supabase queries can be added once core entities exist."
      icon={BarChart3}
    />
  );
}
