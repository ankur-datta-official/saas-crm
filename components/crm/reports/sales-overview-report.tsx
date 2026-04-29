"use client";

import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  LineChart,
  Line,
  Legend
} from "recharts";
import { ReportChartCard } from "./report-chart-card";
import { ReportChartLegend, ReportChartTooltip, REPORT_CHART_COLORS, ReportMetricCard } from "./report-visuals";
import type { SalesOverviewReport as SalesOverviewReportType } from "@/lib/crm/report-queries";
import { formatCurrency } from "@/lib/crm/utils";

export function SalesOverviewReport({ data }: { data: SalesOverviewReportType }) {
  const stats = [
    { title: "Total Companies", value: String(data.totalCompanies), detail: "Active leads and company records", tone: "slate" as const },
    { title: "New Leads", value: String(data.newLeadsInPeriod), detail: "Created during the selected period", tone: "sky" as const },
    { title: "Hot Leads", value: String(data.hotLeads), detail: "High-intent opportunities to prioritize", tone: "rose" as const },
    { title: "Pipeline Value", value: formatCurrency(data.pipelineValue), detail: "Estimated value across open deals", tone: "teal" as const },
    { title: "Won Deals", value: String(data.wonDeals), detail: "Deals already converted", tone: "teal" as const },
    { title: "Lost Deals", value: String(data.lostDeals), detail: "Closed opportunities that were lost", tone: "rose" as const },
    { title: "Meetings", value: String(data.meetingsCompleted), detail: "Logged client conversations", tone: "amber" as const },
    { title: "Follow-ups Due", value: String(data.followupsDue), detail: "Pending actions requiring attention", tone: "amber" as const },
    { title: "Overdue", value: String(data.overdueFollowups), detail: "Follow-ups now overdue", tone: "rose" as const },
    { title: "Documents", value: String(data.documentsSubmitted), detail: "Submitted files and proposals", tone: "sky" as const },
    { title: "Open Help", value: String(data.openHelpRequests), detail: "Internal blockers still unresolved", tone: "amber" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <ReportMetricCard key={stat.title} title={stat.title} value={stat.value} detail={stat.detail} tone={stat.tone} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard
          title="Lead Temperature Distribution"
          description="See how current opportunities are spread by sales temperature."
          isEmpty={data.leadTemperatureDistribution.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.leadTemperatureDistribution}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="temperature"
              >
                {data.leadTemperatureDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<ReportChartTooltip />} />
              <Legend content={<ReportChartLegend />} />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard
          title="Pipeline Stage Distribution"
          description="Compare how many deals are currently sitting in each active stage."
          isEmpty={data.pipelineStageDistribution.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineStageDistribution} layout="vertical">
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" horizontal vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="stage" 
                type="category" 
                width={100} 
                fontSize={12}
                tick={{ fill: "#64748b" }}
              />
              <Tooltip 
                cursor={{ fill: "rgba(148, 163, 184, 0.08)" }}
                content={<ReportChartTooltip />}
              />
              <Bar dataKey="count" radius={[0, 8, 8, 0]}>
                {data.pipelineStageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || REPORT_CHART_COLORS[index % REPORT_CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard
          title="Monthly Lead Creation Trend"
          description="Track lead creation volume over time to spot growth or slowdowns."
          isEmpty={data.monthlyLeadCreationTrend.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyLeadCreationTrend}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tick={{ fill: "#64748b" }}
                tickFormatter={(val) => {
                  const [year, month] = val.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0f766e" 
                strokeWidth={2.5} 
                dot={{ fill: "#0f766e", r: 4, stroke: "#ffffff", strokeWidth: 2 }}
                activeDot={{ r: 6, fill: "#0f766e", stroke: "#ffffff", strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard
          title="Meeting Activity Trend"
          description="Monitor recent meeting activity to keep client conversations moving."
          isEmpty={data.meetingActivityTrend.length === 0}
        >
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.meetingActivityTrend}>
              <CartesianGrid stroke="#e2e8f0" strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tick={{ fill: "#64748b" }}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              />
              <YAxis fontSize={12} tick={{ fill: "#64748b" }} />
              <Tooltip content={<ReportChartTooltip />} />
              <Bar dataKey="count" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>
    </div>
  );
}
