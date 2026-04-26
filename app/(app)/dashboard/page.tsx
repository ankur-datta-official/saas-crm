import {
  CalendarClock,
  Flame,
  Handshake,
  LineChart,
  TimerOff,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { requireOrganization } from "@/lib/auth/session";

const stats = [
  { title: "Total Leads", value: "0", description: "All active lead records", icon: Users, tone: "teal" },
  { title: "Hot Leads", value: "0", description: "High-priority opportunities", icon: Flame, tone: "rose" },
  { title: "Today's Follow-ups", value: "0", description: "Due before end of day", icon: Handshake, tone: "amber" },
  { title: "Missed Follow-ups", value: "0", description: "Needs immediate review", icon: TimerOff, tone: "rose" },
  { title: "Meetings This Week", value: "0", description: "Scheduled client sessions", icon: CalendarClock, tone: "blue" },
  { title: "Pipeline Value", value: "$0", description: "Open opportunity value", icon: LineChart, tone: "slate" },
] as const;

export default async function DashboardPage() {
  const organization = await requireOrganization();

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description={`A first-pass CRM command center for ${organization.name} leads, meetings, follow-ups, and pipeline health.`}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </section>
      <section className="mt-6 grid gap-4 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle>Pipeline overview</CardTitle>
            <CardDescription>Chart wiring will arrive when opportunity data is introduced.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-72 items-center justify-center rounded-md border border-dashed bg-muted/30 text-sm text-muted-foreground">
              Recharts pipeline visualization placeholder
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Activity health</CardTitle>
            <CardDescription>Early status indicators for the dashboard shell.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {["Active", "Pending", "Missed"].map((status) => (
              <div key={status} className="flex items-center justify-between rounded-md border p-3">
                <span className="text-sm font-medium">{status}</span>
                <StatusBadge status={status} />
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
