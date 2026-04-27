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
import type { DocumentReportData } from "@/lib/crm/report-queries";
import { DocumentStatusBadge, DocumentTypeBadge } from "@/components/crm/document-badges";
import Link from "next/link";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

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
        <ReportChartCard title="Documents by Type">
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Documents by Status">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.documentsByStatus}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="status" fontSize={12} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#6366f1" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Documents</p>
          <p className="mt-2 text-3xl font-bold">{data.totalDocuments}</p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Most Active User</p>
          <p className="mt-2 text-xl font-bold truncate">
            {data.documentsByUser[0]?.user || "N/A"}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4 text-center">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Latest Document</p>
          <p className="mt-2 text-xl font-bold truncate">
            {data.recentDocuments[0]?.title || "N/A"}
          </p>
        </div>
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
