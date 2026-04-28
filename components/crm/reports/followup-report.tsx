"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie,
  Legend,
  LineChart,
  Line
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportDataTable } from "./report-data-table";
import type { FollowupReportData } from "@/lib/crm/report-queries";
import { FollowupStatusBadge, FollowupPriorityBadge } from "@/components/crm/followup-badges";
import Link from "next/link";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export function FollowupReport({ data }: { data: FollowupReportData }) {
  const columns = [
    { 
      header: "Scheduled", 
      accessorKey: "scheduled_at",
      cell: (item: any) => new Date(item.scheduled_at).toLocaleString()
    },
    { 
      header: "Company", 
      accessorKey: "companies.name",
      cell: (item: any) => (
        <Link href={`/companies/${item.companies?.id}`} className="font-medium text-primary hover:underline">
          {item.companies?.name}
        </Link>
      )
    },
    { header: "Title", accessorKey: "title" },
    { header: "Type", accessorKey: "followup_type" },
    { 
      header: "Priority", 
      accessorKey: "priority",
      cell: (item: any) => <FollowupPriorityBadge priority={item.priority} />
    },
    { header: "Assigned To", accessorKey: "assigned_profile.full_name" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (item: any) => <FollowupStatusBadge status={item.status} />
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Follow-up Status Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.followupStatusDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="status"
              >
                {data.followupStatusDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Follow-up Completion Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.followupCompletionTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#10b981" 
                strokeWidth={2} 
                dot={{ fill: "#10b981", r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Today&apos;s Follow-ups</p>
          <p className="mt-2 text-3xl font-bold">{data.todaysFollowups.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Completion Rate</p>
          <p className="mt-2 text-3xl font-bold text-teal-600">{data.completionRate.toFixed(1)}%</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Overdue Follow-ups</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{data.overdueFollowups.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Upcoming Follow-ups</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{data.upcomingFollowups.length}</p>
        </div>
      </div>

      <ReportDataTable 
        title="Overdue Follow-ups" 
        columns={columns} 
        data={data.overdueFollowups} 
        exportFileName="overdue-followups"
      />

      <ReportDataTable 
        title="Today&apos;s Pending Follow-ups" 
        columns={columns} 
        data={data.todaysFollowups} 
        exportFileName="todays-followups"
      />
    </div>
  );
}
