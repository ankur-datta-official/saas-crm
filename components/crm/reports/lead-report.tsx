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
  PieChart,
  Pie
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportDataTable } from "./report-data-table";
import { ReportChartLegend, ReportChartTooltip, REPORT_CHART_COLORS } from "./report-visuals";
import type { LeadReportData } from "@/lib/crm/report-queries";
import { LeadTemperatureBadge } from "@/components/crm/lead-temperature-badge";
import { RatingBadge } from "@/components/crm/rating-badge";
import { formatCurrency } from "@/lib/crm/utils";
import Link from "next/link";

export function LeadReport({ data }: { data: LeadReportData }) {
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
    { header: "Industry", accessorKey: "industries.name" },
    { header: "Category", accessorKey: "company_categories.name" },
    { header: "Assigned To", accessorKey: "assigned_profile.full_name" },
    { header: "Stage", accessorKey: "pipeline_stages.name" },
    { 
      header: "Rating", 
      accessorKey: "success_rating",
      cell: (item: any) => <RatingBadge rating={item.success_rating} />
    },
    { 
      header: "Temperature", 
      accessorKey: "lead_temperature",
      cell: (item: any) => <LeadTemperatureBadge temperature={item.lead_temperature} />
    },
    { 
      header: "Value", 
      accessorKey: "estimated_value",
      cell: (item: any) => formatCurrency(item.estimated_value)
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
        <ReportChartCard title="Leads by Industry" description="Compare lead distribution across active industries." isEmpty={data.leadsByIndustry.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.leadsByIndustry} layout="vertical">
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" hide />
              <YAxis dataKey="industry" type="category" width={120} fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Bar dataKey="count" fill="#0f766e" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Leads by Category" description="See which lead categories currently carry the most volume." isEmpty={data.leadsByCategory.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.leadsByCategory}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="category"
              >
                {data.leadsByCategory.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ReportChartTooltip />} />
              <Legend content={<ReportChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReportChartCard title="Leads by Source" description="Understand which sources generate the most leads." height={250} isEmpty={data.leadsBySource.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.leadsBySource}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="source" fontSize={12} tick={{ fill: "#64748b" }} />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Bar dataKey="count" fill="#0284c7" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Leads by Assigned User" description="Spot ownership load across your active team." height={250} isEmpty={data.leadsByAssignedUser.length === 0}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.leadsByAssignedUser}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="user" fontSize={10} interval={0} tick={{ width: 60, fill: "#64748b" }} />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Bar dataKey="count" fill="#0f766e" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <ReportDataTable 
        title="Hot Leads" 
        columns={columns} 
        data={data.hotLeads} 
        exportFileName="hot-leads"
      />

      <ReportDataTable 
        title="Leads Without Follow-up (Last 30 Days)" 
        columns={columns} 
        data={data.leadsWithoutFollowup} 
        exportFileName="leads-without-followup"
      />
    </div>
  );
}
