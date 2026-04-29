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
import { ReportChartLegend, ReportChartTooltip, REPORT_CHART_COLORS, ReportMetricCard } from "./report-visuals";
import type { FollowupReportData } from "@/lib/crm/report-queries";
import { FollowupStatusBadge, FollowupPriorityBadge } from "@/components/crm/followup-badges";
import Link from "next/link";

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
        <ReportChartCard title="Follow-up Status Distribution" description="See the current balance of pending, completed, and overdue work." isEmpty={data.followupStatusDistribution.length === 0}>
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
                  <Cell key={`cell-${index}`} fill={REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ReportChartTooltip />} />
              <Legend content={<ReportChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Follow-up Completion Trend" description="Track how consistently follow-ups are being completed over time." isEmpty={data.followupCompletionTrend.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.followupCompletionTrend}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fill: "#64748b" }}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0f766e" 
                strokeWidth={2} 
                dot={{ fill: "#0f766e", r: 4, stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetricCard title="Today&apos;s Follow-ups" value={String(data.todaysFollowups.length)} detail="Items scheduled for today" tone="slate" />
        <ReportMetricCard title="Completion Rate" value={`${data.completionRate.toFixed(1)}%`} detail="Completed vs. total follow-ups" tone="teal" />
        <ReportMetricCard title="Overdue Follow-ups" value={String(data.overdueFollowups.length)} detail="Pending actions that missed their date" tone="rose" />
        <ReportMetricCard title="Upcoming Follow-ups" value={String(data.upcomingFollowups.length)} detail="Future follow-ups already planned" tone="sky" />
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
