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
import { ReportChartLegend, ReportChartTooltip, REPORT_CHART_COLORS, ReportMetricCard } from "./report-visuals";
import type { DocumentReportData } from "@/lib/crm/report-queries";
import { DocumentStatusBadge, DocumentTypeBadge } from "@/components/crm/document-badges";
import Link from "next/link";

export function DocumentReport({ data }: { data: DocumentReportData }) {
  const columns = [
    { 
      header: "Title", 
      accessorKey: "title",
      cell: (item: any) => (
        <Link href={`/documents/${item.id}`} className="font-medium text-primary hover:underline">
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
      accessorKey: "document_type",
      cell: (item: any) => <DocumentTypeBadge type={item.document_type} />
    },
    { 
      header: "Status", 
      accessorKey: "status",
      cell: (item: any) => <DocumentStatusBadge status={item.status} />
    },
    { header: "Uploaded By", accessorKey: "uploaded_profile.full_name" },
    { 
      header: "Date", 
      accessorKey: "created_at",
      cell: (item: any) => new Date(item.created_at).toLocaleDateString()
    },
    { header: "Size", accessorKey: "file_size_mb", cell: (item: any) => `${item.file_size_mb} MB` },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Documents by Type" description="Review which document types are being submitted most often." isEmpty={data.documentsByType.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.documentsByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="type"
              >
                {data.documentsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ReportChartTooltip />} />
              <Legend content={<ReportChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Documents by Status" description="Check how documents are distributed across submission statuses." isEmpty={data.documentsByStatus.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.documentsByStatus}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Bar dataKey="count" fill="#0284c7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <ReportMetricCard title="Total Documents" value={String(data.totalDocuments)} detail="Documents in the selected range" tone="slate" />
        <ReportMetricCard title="Most Active User" value={data.documentsByUser[0]?.user || "N/A"} detail="Top uploader by document volume" tone="sky" />
        <ReportMetricCard title="Latest Document" value={data.recentDocuments[0]?.title || "N/A"} detail="Most recently uploaded file" tone="amber" />
      </div>

      <ReportDataTable 
        title="Recent Document Submissions" 
        columns={columns} 
        data={data.recentDocuments} 
        exportFileName="recent-documents"
      />
    </div>
  );
}
