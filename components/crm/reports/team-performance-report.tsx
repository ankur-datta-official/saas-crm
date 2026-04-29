"use client";

import { ReportDataTable } from "./report-data-table";
import { ReportMetricCard } from "./report-visuals";
import type { TeamPerformanceReportData } from "@/lib/crm/report-queries";
import { formatCurrency } from "@/lib/crm/utils";

export function TeamPerformanceReport({ data }: { data: TeamPerformanceReportData }) {
  const columns = [
    { 
      header: "User", 
      accessorKey: "userName",
      cell: (item: any) => (
        <div>
          <p className="font-medium">{item.userName}</p>
          <p className="text-xs text-muted-foreground">{item.userEmail}</p>
        </div>
      )
    },
    { header: "Companies", accessorKey: "assignedCompanies" },
    { header: "Meetings", accessorKey: "meetingsCreated" },
    { header: "Follow-ups Comp.", accessorKey: "followupsCompleted" },
    { 
      header: "Overdue", 
      accessorKey: "overdueFollowups",
      cell: (item: any) => (
        <span className={item.overdueFollowups > 0 ? "text-rose-600 font-bold" : ""}>
          {item.overdueFollowups}
        </span>
      )
    },
    { header: "Documents", accessorKey: "documentsUploaded" },
    { header: "Help Requests", accessorKey: "helpRequestsCreated" },
    { header: "Help Resolved", accessorKey: "helpRequestsResolved" },
    { header: "Hot Leads", accessorKey: "hotLeadsManaged" },
    { 
      header: "Pipeline Value", 
      accessorKey: "pipelineValueManaged",
      cell: (item: any) => formatCurrency(item.pipelineValueManaged)
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetricCard title="Total Team Members" value={String(data.teamStats.length)} detail="Active users included in this report" tone="slate" />
        <ReportMetricCard
          title="Top Performer (Value)"
          value={[...data.teamStats].sort((a, b) => b.pipelineValueManaged - a.pipelineValueManaged)[0]?.userName || "N/A"}
          detail="Highest owned pipeline value"
          tone="teal"
        />
        <ReportMetricCard
          title="Top Performer (Meetings)"
          value={[...data.teamStats].sort((a, b) => b.meetingsCreated - a.meetingsCreated)[0]?.userName || "N/A"}
          detail="Most meetings logged"
          tone="sky"
        />
        <ReportMetricCard
          title="Highest Follow-up Rate"
          value={[...data.teamStats].sort((a, b) => (b.followupsCompleted / (b.followupsCreated || 1)) - (a.followupsCompleted / (a.followupsCreated || 1)))[0]?.userName || "N/A"}
          detail="Best completion ratio"
          tone="amber"
        />
      </div>

      <ReportDataTable 
        title="Team Performance Matrix" 
        columns={columns} 
        data={data.teamStats} 
        exportFileName="team-performance"
      />
    </div>
  );
}
