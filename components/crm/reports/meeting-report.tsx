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
import type { MeetingReportData } from "@/lib/crm/report-queries";
import { InteractionTypeBadge } from "@/components/crm/interaction-type-badge";
import { RatingBadge } from "@/components/crm/rating-badge";
import { LeadTemperatureBadge } from "@/components/crm/lead-temperature-badge";
import Link from "next/link";

const COLORS = ["#0ea5e9", "#f59e0b", "#ef4444", "#10b981", "#6366f1", "#ec4899", "#8b5cf6"];

export function MeetingReport({ data }: { data: MeetingReportData }) {
  const columns = [
    { 
      header: "Date", 
      accessorKey: "meeting_datetime",
      cell: (item: any) => new Date(item.meeting_datetime).toLocaleDateString()
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
    { header: "Contact", accessorKey: "contact_persons.name" },
    { 
      header: "Type", 
      accessorKey: "interaction_type",
      cell: (item: any) => <InteractionTypeBadge type={item.interaction_type} />
    },
    { header: "Salesperson", accessorKey: "profiles.full_name" },
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
    { header: "Next Action", accessorKey: "next_action" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <ReportChartCard title="Meetings by Type">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data.meetingsByType}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="count"
                nameKey="type"
              >
                {data.meetingsByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ReportChartCard>

        <ReportChartCard title="Meetings by Salesperson">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data.meetingsBySalesperson}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="user" fontSize={10} interval={0} tick={{ width: 60 }} />
              <YAxis fontSize={12} />
              <Tooltip />
              <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ReportChartCard>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Meetings</p>
          <p className="mt-2 text-3xl font-bold">{data.totalMeetings}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Average Success Rating</p>
          <p className="mt-2 text-3xl font-bold text-amber-600">{data.avgSuccessRating.toFixed(1)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Hot Meetings</p>
          <p className="mt-2 text-3xl font-bold text-rose-600">{data.hotMeetings.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Meetings with Next Action</p>
          <p className="mt-2 text-3xl font-bold text-blue-600">{data.meetingsWithNextAction.length}</p>
        </div>
      </div>

      <ReportDataTable 
        title="Meetings Without Follow-up" 
        columns={columns} 
        data={data.meetingsWithoutFollowup} 
        exportFileName="meetings-without-followup"
      />

      <ReportDataTable 
        title="Recent Meetings" 
        columns={columns} 
        data={data.hotMeetings} // Using hotMeetings as a proxy for interesting ones, or could pass all
        exportFileName="recent-meetings"
      />
    </div>
  );
}
