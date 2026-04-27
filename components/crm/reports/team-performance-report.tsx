"use client";

import { ReportDataTable } from "./report-data-table";
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
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Team Members</p>
          <p className="mt-2 text-3xl font-bold">{data.teamStats.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Performer (Value)</p>
          <p className="mt-2 text-xl font-bold truncate">
            {[...data.teamStats].sort((a, b) => b.pipelineValueManaged - a.pipelineValueManaged)[0]?.userName || "N/A"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Top Performer (Meetings)</p>
          <p className="mt-2 text-xl font-bold truncate">
            {[...data.teamStats].sort((a, b) => b.meetingsCreated - a.meetingsCreated)[0]?.userName || "N/A"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Highest Follow-up Rate</p>
          <p className="mt-2 text-xl font-bold truncate">
            {[...data.teamStats].sort((a, b) => (b.followupsCompleted / (b.followupsCreated || 1)) - (a.followupsCompleted / (a.followupsCreated || 1)))[0]?.userName || "N/A"}
          </p>
        </div>
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
