import { Suspense } from "react";
import { BarChart3 } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReportFilterBar } from "@/components/crm/reports/report-filter-bar";
import { ReportTabs } from "@/components/crm/reports/report-tabs";
import { SalesOverviewReport } from "@/components/crm/reports/sales-overview-report";
import { LeadReport } from "@/components/crm/reports/lead-report";
import { PipelineReport } from "@/components/crm/reports/pipeline-report";
import { MeetingReport } from "@/components/crm/reports/meeting-report";
import { FollowupReport } from "@/components/crm/reports/followup-report";
import { DocumentReport } from "@/components/crm/reports/document-report";
import { HelpRequestReport } from "@/components/crm/reports/help-request-report";
import { TeamPerformanceReport } from "@/components/crm/reports/team-performance-report";
import { 
  getIndustries, 
  getCompanyCategories, 
  getPipelineStages, 
  getTeamMembers 
} from "@/lib/crm/queries";
import { 
  getSalesOverviewReport,
  getLeadReport,
  getPipelineReport,
  getMeetingReport,
  getFollowupReport,
  getDocumentReport,
  getHelpRequestReport,
  getTeamPerformanceReport,
  type ReportFilters
} from "@/lib/crm/report-queries";

interface ReportsPageProps {
  searchParams: Promise<{
    tab?: string;
    dateRange?: string;
    assignedUserId?: string;
    industryId?: string;
    pipelineStageId?: string;
    leadTemperature?: string;
    companyCategoryId?: string;
  }>;
}

export default async function ReportsPage({ searchParams }: ReportsPageProps) {
  const params = await searchParams;
  const currentTab = params.tab || "sales-overview";

  const filters: ReportFilters = {
    dateRange: (params.dateRange as any) || "this_month",
    assignedUserId: params.assignedUserId === "all" ? undefined : params.assignedUserId,
    industryId: params.industryId === "all" ? undefined : params.industryId,
    pipelineStageId: params.pipelineStageId === "all" ? undefined : params.pipelineStageId,
    leadTemperature: params.leadTemperature === "all" ? undefined : params.leadTemperature,
    companyCategoryId: params.companyCategoryId === "all" ? undefined : params.companyCategoryId,
  };

  const [industries, categories, stages, users] = await Promise.all([
    getIndustries(),
    getCompanyCategories(),
    getPipelineStages(),
    getTeamMembers(),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Analyze your CRM data and team performance."
      />

      <ReportFilterBar 
        users={users}
        industries={industries}
        stages={stages}
        categories={categories}
      />

      <ReportTabs currentTab={currentTab}>
        <Suspense fallback={<div className="h-[400px] flex items-center justify-center">Loading report...</div>}>
          <TabsContent value="sales-overview">
            <SalesOverviewReportView filters={filters} />
          </TabsContent>
          <TabsContent value="leads">
            <LeadReportView filters={filters} />
          </TabsContent>
          <TabsContent value="pipeline">
            <PipelineReportView filters={filters} />
          </TabsContent>
          <TabsContent value="meetings">
            <MeetingReportView filters={filters} />
          </TabsContent>
          <TabsContent value="follow-ups">
            <FollowupReportView filters={filters} />
          </TabsContent>
          <TabsContent value="documents">
            <DocumentReportView filters={filters} />
          </TabsContent>
          <TabsContent value="help-requests">
            <HelpRequestReportView filters={filters} />
          </TabsContent>
          <TabsContent value="team">
            <TeamPerformanceReportView filters={filters} />
          </TabsContent>
        </Suspense>
      </ReportTabs>
    </div>
  );
}

async function SalesOverviewReportView({ filters }: { filters: ReportFilters }) {
  const data = await getSalesOverviewReport(filters);
  return <SalesOverviewReport data={data} />;
}

async function LeadReportView({ filters }: { filters: ReportFilters }) {
  const data = await getLeadReport(filters);
  return <LeadReport data={data} />;
}

async function PipelineReportView({ filters }: { filters: ReportFilters }) {
  const data = await getPipelineReport(filters);
  return <PipelineReport data={data} />;
}

async function MeetingReportView({ filters }: { filters: ReportFilters }) {
  const data = await getMeetingReport(filters);
  return <MeetingReport data={data} />;
}

async function FollowupReportView({ filters }: { filters: ReportFilters }) {
  const data = await getFollowupReport(filters);
  return <FollowupReport data={data} />;
}

async function DocumentReportView({ filters }: { filters: ReportFilters }) {
  const data = await getDocumentReport(filters);
  return <DocumentReport data={data} />;
}

async function HelpRequestReportView({ filters }: { filters: ReportFilters }) {
  const data = await getHelpRequestReport(filters);
  return <HelpRequestReport data={data} />;
}

async function TeamPerformanceReportView({ filters }: { filters: ReportFilters }) {
  const data = await getTeamPerformanceReport(filters);
  return <TeamPerformanceReport data={data} />;
}
