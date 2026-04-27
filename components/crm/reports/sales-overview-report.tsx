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
import { Users, Flame, LineChart as LineChartIcon, Handshake, TimerOff, FileText, LifeBuoy, Target, CheckCircle2, XCircle } from "lucide-react";
import { StatCard } from "@/components/shared/stat-card";
import { ReportChartCard } from "./report-chart-card";
import type { SalesOverviewReport as SalesOverviewReportType } from "@/lib/crm/report-queries";
import { formatCurrency } from "@/lib/crm/utils";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export function SalesOverviewReport({ data }: { data: SalesOverviewReportType }) {
  const stats = [
    { title: "Total Companies", value: String(data.totalCompanies), icon: Users, tone: "slate" as const },
    { title: "New Leads", value: String(data.newLeadsInPeriod), description: "In selected period", icon: Target, tone: "blue" as const },
    { title: "Hot Leads", value: String(data.hotLeads), icon: Flame, tone: "rose" as const },
    { title: "Pipeline Value", value: formatCurrency(data.pipelineValue), icon: LineChartIcon, tone: "slate" as const },
    { title: "Won Deals", value: String(data.wonDeals), icon: CheckCircle2, tone: "teal" as const },
    { title: "Lost Deals", value: String(data.lostDeals), icon: XCircle, tone: "rose" as const },
    { title: "Meetings", value: String(data.meetingsCompleted), icon: Handshake, tone: "amber" as const },
    { title: "Follow-ups Due", value: String(data.followupsDue), icon: TimerOff, tone: "amber" as const },
    { title: "Overdue", value: String(data.overdueFollowups), icon: TimerOff, tone: "rose" as const },
    { title: "Documents", value: String(data.documentsSubmitted), icon: FileText, tone: "blue" as const },
    { title: "Open Help", value: String(data.openHelpRequests), icon: LifeBuoy, tone: "amber" as const },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Lead Temperature Distribution">
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
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Pipeline Stage Distribution">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.pipelineStageDistribution} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
              <XAxis type="number" hide />
              <YAxis 
                dataKey="stage" 
                type="category" 
                width={100} 
                fontSize={12}
                tick={{ fill: "currentColor" }}
              />
              <Tooltip 
                cursor={{ fill: 'transparent' }}
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
              />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.pipelineStageDistribution.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Monthly Lead Creation Trend">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyLeadCreationTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="month" 
                fontSize={12}
                tickFormatter={(val) => {
                  const [year, month] = val.split('-');
                  const date = new Date(parseInt(year), parseInt(month) - 1);
                  return date.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });
                }}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="count" 
                stroke="#0ea5e9" 
                strokeWidth={2} 
                dot={{ fill: "#0ea5e9", r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Meeting Activity Trend">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.meetingActivityTrend}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis 
                dataKey="date" 
                fontSize={12}
                tickFormatter={(val) => new Date(val).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
              />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>
    </div>
  );
}
