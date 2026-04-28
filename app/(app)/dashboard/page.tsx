import {
  CalendarClock,
  Flame,
  Handshake,
  LineChart,
  TimerOff,
  Users,
  LifeBuoy,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PageHeader } from "@/components/shared/page-header";
import { StatCard } from "@/components/shared/stat-card";
import { StatusBadge } from "@/components/shared/status-badge";
import { getDashboardMetrics } from "@/lib/crm/queries";
import { getOpenHelpRequestsCount } from "@/lib/crm/help-request-queries";
import { formatCurrency } from "@/lib/crm/utils";
import { requireOrganization } from "@/lib/auth/session";
import { getActiveUsersCount, getPendingInvitationsCount } from "@/lib/team/team-queries";

export default async function DashboardPage() {
  const organization = await requireOrganization();
  const [metrics, openHelpRequestsCount, activeUsersCount, pendingInvitationsCount] = await Promise.all([
    getDashboardMetrics(),
    getOpenHelpRequestsCount(),
    getActiveUsersCount(),
    getPendingInvitationsCount(),
  ]);
  const stats = [
    { title: "Total Leads", value: String(metrics.totalCompanies), description: "All active company lead records", icon: Users, tone: "teal", href: "/reports?tab=leads" },
    { title: "Hot Leads", value: String(metrics.hotLeads), description: "Leads marked with hot temperature", icon: Flame, tone: "rose", href: "/reports?tab=leads&leadTemperature=hot" },
    { title: "Active Users", value: String(activeUsersCount), description: "Team members with current CRM access", icon: Users, tone: "blue", href: "/team" },
    { title: "Pending Invitations", value: String(pendingInvitationsCount), description: "Invite links waiting to be accepted", icon: CalendarClock, tone: "slate", href: "/team" },
    { title: "Open Help Requests", value: String(openHelpRequestsCount), description: "Blocked deals needing support", icon: LifeBuoy, tone: "amber", href: "/reports?tab=help-requests" },
    { title: "Today's Follow-ups", value: String(metrics.todaysFollowups), description: "Due before end of day", icon: Handshake, tone: "amber", href: "/reports?tab=follow-ups" },
    { title: "Missed Follow-ups", value: String(metrics.missedFollowups), description: "Needs immediate review", icon: TimerOff, tone: "rose", href: "/reports?tab=follow-ups" },
    { title: "Pipeline Value", value: formatCurrency(metrics.pipelineValue), description: "Open company lead value", icon: LineChart, tone: "slate", href: "/reports?tab=pipeline" },
  ] as const;

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
