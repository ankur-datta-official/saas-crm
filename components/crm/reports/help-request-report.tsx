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
  Legend
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportDataTable } from "./report-data-table";
import type { HelpRequestReportData } from "@/lib/crm/report-queries";
import { HelpRequestStatusBadge, HelpRequestPriorityBadge, HelpRequestTypeBadge } from "@/components/crm/help-request-badges";
import Link from "next/link";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export function HelpRequestReport({ data }: { data: HelpRequestReportData }) {
  const columns = [
    { 
      header: "Title", 
      accessorKey: "title",
      cell: (item: any) => (
        <Link href={`/need-help/${item.id}`} className="font-medium text-primary hover:underline">
          {item.title}
        </Link>
      )
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
    { 
      header: "Type", 
      accessorKey: "help_type",
      cell: (item: any) => <HelpRequestTypeBadge type={item.help_type} />
    },
    { 
      header: "Priority", 
      accessorKey: "priority",
      cell: (item: any) => <HelpRequestPriorityBadge priority={item.priority} />
    },
    { header: "Requested By", accessorKey: "requested_profile.full_name" },
    { header: "Assigned To", accessorKey: "assigned_profile.full_name" },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (item: any) => <HelpRequestStatusBadge status={item.status} />
    },
    { 
      header: "Date", 
      accessorKey: "created_at",
      cell: (item: any) => new Date(item.created_at).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Help Requests by Type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.helpRequestsByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="type"
              >
                {data.helpRequestsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Help Requests by Priority">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.helpRequestsByPriority}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="priority" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {data.helpRequestsByPriority.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={
                      entry.priority === "urgent" ? "#ef4444" : 
                      entry.priority === "high" ? "#f59e0b" : 
                      entry.priority === "medium" ? "#0ea5e9" : "#94a3b8"
                    } 
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Open Requests</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{data.openHelpRequests}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Urgent Requests</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{data.urgentHelpRequests}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Resolved Requests</p>
          <p className="mt-2 text-3xl font-bold text-teal-600">{data.resolvedRequests}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Assignee</p>
          <p className="mt-2 text-xl font-bold truncate">
            {data.helpRequestsByAssignedUser[0]?.user || "N/A"}
          </p>
        </div>
      </div>

      <ReportDataTable 
        title="Recent Help Requests & Escalations" 
        columns={columns} 
        data={data.recentHelpRequests} 
        exportFileName="help-requests"
      />
    </div>
  );
}
