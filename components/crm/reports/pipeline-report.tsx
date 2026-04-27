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
  Legend,
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportDataTable } from "./report-data-table";
import type { PipelineReportData } from "@/lib/crm/report-queries";
import { formatCurrency } from "@/lib/crm/utils";
import { RatingBadge } from "@/components/crm/rating-badge";
import Link from "next/link";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export function PipelineReport({ data }: { data: PipelineReportData }) {
  const columns = [
    { 
      header: "Company", 
      accessorKey: "name",
      cell: (item: any) => (
        <Link href={`/companies/${item.id}`} className="font-medium text-primary hover:underline">
          {item.name}
        </Link>
      )
    },
    { header: "Stage", accessorKey: "pipeline_stages.name" },
    { 
      header: "Value", 
      accessorKey: "estimated_value",
      cell: (item: any) => formatCurrency(item.estimated_value)
    },
    { 
      header: "Rating", 
      accessorKey: "success_rating",
      cell: (item: any) => <RatingBadge rating={item.success_rating} />
    },
    { 
      header: "Created", 
      accessorKey: "created_at",
      cell: (item: any) => new Date(item.created_at).toLocaleDateString()
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Pipeline Funnel (Count by Stage)">
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip />
              <Funnel
                data={data.companiesByStage}
                dataKey="count"
                nameKey="stage"
              >
                {data.companiesByStage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
                <LabelList position="right" fill="#888" dataKey="stage" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Pipeline Value by Stage">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineValueByStage}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" fontSize={12} />
              <YAxis 
                fontSize={12} 
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} 
              />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                {data.pipelineValueByStage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Won Deals</p>
          <p className="mt-2 text-3xl font-bold text-teal-600">{data.wonLostCount.won}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Lost Deals</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{data.wonLostCount.lost}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Active Pipeline</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">
            {data.companiesByStage.reduce((sum, item) => sum + item.count, 0)}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average Success Rating</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">
            {data.avgRatingByStage.length > 0 
              ? (data.avgRatingByStage.reduce((sum, item) => sum + item.avgRating, 0) / data.avgRatingByStage.length).toFixed(1)
              : "0.0"}
          </p>
        </div>
      </div>

      <ReportDataTable 
        title="Stuck Leads (No activity in 30 days)" 
        columns={columns} 
        data={data.stuckLeads} 
        exportFileName="stuck-leads"
      />

      <ReportDataTable 
        title="Negotiation Stage Leads" 
        columns={columns} 
        data={data.negotiationStageLeads} 
        exportFileName="negotiation-leads"
      />
    </div>
  );
}
