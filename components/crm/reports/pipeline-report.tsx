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
  FunnelChart,
  Funnel,
  LabelList
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportDataTable } from "./report-data-table";
import { ReportChartTooltip, REPORT_CHART_COLORS, ReportMetricCard } from "./report-visuals";
import type { PipelineReportData } from "@/lib/crm/report-queries";
import { formatCurrency } from "@/lib/crm/utils";
import { RatingBadge } from "@/components/crm/rating-badge";
import Link from "next/link";

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
        <ReportChartCard title="Pipeline Funnel (Count by Stage)" description="See how deal volume narrows as opportunities move forward." isEmpty={data.companiesByStage.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <FunnelChart>
              <Tooltip content={<ReportChartTooltip />} />
              <Funnel
                data={data.companiesByStage}
                dataKey="count"
                nameKey="stage"
              >
                {data.companiesByStage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
                <LabelList position="right" fill="#64748b" dataKey="stage" />
              </Funnel>
            </FunnelChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Pipeline Value by Stage" description="Review where estimated deal value is concentrated across the funnel." isEmpty={data.pipelineValueByStage.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineValueByStage}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="stage" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis 
                fontSize={12} 
                tick={{ fill: "#64748b" }}
                tickFormatter={(val) => `$${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`} 
              />
              <Tooltip content={<ReportChartTooltip />} formatter={(value: number) => formatCurrency(value)} />
              <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                {data.pipelineValueByStage.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <ReportMetricCard title="Won Deals" value={String(data.wonLostCount.won)} detail="Deals moved into a won stage" tone="teal" />
        <ReportMetricCard title="Lost Deals" value={String(data.wonLostCount.lost)} detail="Deals marked as lost" tone="rose" />
        <ReportMetricCard
          title="Total Active Pipeline"
          value={String(data.companiesByStage.reduce((sum, item) => sum + item.count, 0))}
          detail="Open deals currently in the funnel"
          tone="sky"
        />
        <ReportMetricCard
          title="Average Success Rating"
          value={data.avgRatingByStage.length > 0
            ? (data.avgRatingByStage.reduce((sum, item) => sum + item.avgRating, 0) / data.avgRatingByStage.length).toFixed(1)
            : "0.0"}
          detail="Average rating across active stages"
          tone="amber"
        />
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
