import { requireOrganization } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export type DateRangeFilter = "today" | "this_week" | "this_month" | "last_30_days" | "this_quarter" | "custom";

export type ReportFilters = {
  dateRange?: DateRangeFilter;
  startDate?: string;
  endDate?: string;
  assignedUserId?: string;
  industryId?: string;
  pipelineStageId?: string;
  leadTemperature?: string;
  companyCategoryId?: string;
};

function buildDateRange(filters: ReportFilters): { start: Date; end: Date } {
  const now = new Date();
  const end = new Date(now);
  end.setHours(23, 59, 59, 999);

  let start = new Date(now);

  switch (filters.dateRange) {
    case "today":
      start.setHours(0, 0, 0, 0);
      break;
    case "this_week":
      start.setHours(0, 0, 0, 0);
      start.setDate(start.getDate() - start.getDay());
      break;
    case "this_month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "last_30_days":
      start.setDate(start.getDate() - 30);
      break;
    case "this_quarter":
      const quarter = Math.floor(now.getMonth() / 3);
      start = new Date(now.getFullYear(), quarter * 3, 1);
      break;
    case "custom":
      if (filters.startDate) {
        start = new Date(filters.startDate);
        start.setHours(0, 0, 0, 0);
      }
      if (filters.endDate) {
        end.setTime(new Date(filters.endDate).getTime());
        end.setHours(23, 59, 59, 999);
      }
      break;
    default:
      start.setHours(0, 0, 0, 0);
  }

  return { start, end };
}

export type SalesOverviewReport = {
  totalCompanies: number;
  newLeadsInPeriod: number;
  hotLeads: number;
  veryHotLeads: number;
  pipelineValue: number;
  wonDeals: number;
  lostDeals: number;
  meetingsCompleted: number;
  followupsDue: number;
  overdueFollowups: number;
  documentsSubmitted: number;
  openHelpRequests: number;
  leadTemperatureDistribution: { temperature: string; count: number }[];
  pipelineStageDistribution: { stage: string; count: number; color: string }[];
  monthlyLeadCreationTrend: { month: string; count: number }[];
  meetingActivityTrend: { date: string; count: number }[];
};

export async function getSalesOverviewReport(filters: ReportFilters = {}): Promise<SalesOverviewReport> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  const [
    totalResult,
    newLeadsResult,
    hotResult,
    veryHotResult,
    pipelineValueResult,
    wonResult,
    lostResult,
    meetingsResult,
    followupsDueResult,
    overdueResult,
    documentsResult,
    openHelpResult,
    tempDistResult,
    stageDistResult,
    monthlyTrendResult,
    meetingTrendResult,
  ] = await Promise.all([
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("lead_temperature", "hot")
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("lead_temperature", "very_hot")
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("estimated_value")
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("pipeline_stages.is_won", true)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("pipeline_stages.is_lost", true)
      .neq("status", "archived"),
    supabase
      .from("interactions")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived")
      .gte("meeting_datetime", start.toISOString())
      .lte("meeting_datetime", end.toISOString()),
    supabase
      .from("followups")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "pending")
      .gte("scheduled_at", start.toISOString())
      .lte("scheduled_at", end.toISOString()),
    supabase
      .from("followups")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .eq("status", "pending")
      .lt("scheduled_at", new Date().toISOString()),
    supabase
      .from("documents")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .neq("status", "archived")
      .gte("created_at", start.toISOString())
      .lte("created_at", end.toISOString()),
    supabase
      .from("help_requests")
      .select("id", { count: "exact", head: true })
      .eq("organization_id", organization.id)
      .in("status", ["open", "in_progress"]),
    supabase
      .from("companies")
      .select("lead_temperature")
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("pipeline_stages(name, color)")
      .eq("organization_id", organization.id)
      .neq("status", "archived"),
    supabase
      .from("companies")
      .select("created_at")
      .eq("organization_id", organization.id)
      .neq("status", "archived")
      .order("created_at"),
    supabase
      .from("interactions")
      .select("meeting_datetime")
      .eq("organization_id", organization.id)
      .neq("status", "archived")
      .gte("meeting_datetime", start.toISOString())
      .lte("meeting_datetime", end.toISOString())
      .order("meeting_datetime"),
  ]);

  const tempDist: { [key: string]: number } = { cold: 0, warm: 0, hot: 0, very_hot: 0 };
  (tempDistResult.data || []).forEach((c: any) => {
    if (c.lead_temperature && tempDist[c.lead_temperature] !== undefined) {
      tempDist[c.lead_temperature]++;
    }
  });

  const stageDist: { [key: string]: { count: number; color: string } } = {};
  (stageDistResult.data || []).forEach((c: any) => {
    const stageName = c.pipeline_stages?.name || "Unknown";
    const stageColor = c.pipeline_stages?.color || "#888";
    if (!stageDist[stageName]) {
      stageDist[stageName] = { count: 0, color: stageColor };
    }
    stageDist[stageName].count++;
  });

  const monthlyTrend: { [key: string]: number } = {};
  const meetingTrend: { [key: string]: number } = {};
  const currentMonth = new Date(start);
  while (currentMonth <= end) {
    const monthKey = currentMonth.toISOString().slice(0, 7);
    monthlyTrend[monthKey] = 0;
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }
  (monthlyTrendResult.data || []).forEach((c: any) => {
    const monthKey = c.created_at?.slice(0, 7);
    if (monthKey && monthlyTrend[monthKey] !== undefined) {
      monthlyTrend[monthKey]++;
    }
  });

  (meetingTrendResult.data || []).forEach((m: any) => {
    const dateKey = m.meeting_datetime?.slice(0, 10);
    if (dateKey) {
      meetingTrend[dateKey] = (meetingTrend[dateKey] || 0) + 1;
    }
  });

  const pipelineValue = (pipelineValueResult.data || [])
    .reduce((sum: number, c: any) => sum + (c.estimated_value || 0), 0);

  return {
    totalCompanies: totalResult.count || 0,
    newLeadsInPeriod: newLeadsResult.count || 0,
    hotLeads: hotResult.count || 0,
    veryHotLeads: veryHotResult.count || 0,
    pipelineValue,
    wonDeals: wonResult.count || 0,
    lostDeals: lostResult.count || 0,
    meetingsCompleted: meetingsResult.count || 0,
    followupsDue: followupsDueResult.count || 0,
    overdueFollowups: overdueResult.count || 0,
    documentsSubmitted: documentsResult.count || 0,
    openHelpRequests: openHelpResult.count || 0,
    leadTemperatureDistribution: Object.entries(tempDist).map(([temperature, count]) => ({ temperature, count })),
    pipelineStageDistribution: Object.entries(stageDist).map(([stage, data]) => ({ stage, ...data })),
    monthlyLeadCreationTrend: Object.entries(monthlyTrend).map(([month, count]) => ({ month, count })),
    meetingActivityTrend: Object.entries(meetingTrend).map(([date, count]) => ({ date, count })),
  };
}

export type LeadReportData = {
  leadsByIndustry: { industry: string; count: number }[];
  leadsByCategory: { category: string; count: number }[];
  leadsBySource: { source: string; count: number }[];
  leadsByAssignedUser: { user: string; count: number }[];
  hotLeads: any[];
  recentlyAddedLeads: any[];
  leadsWithoutFollowup: any[];
  leadsWithoutMeeting: any[];
};

export async function getLeadReport(filters: ReportFilters = {}): Promise<LeadReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  let baseQuery = supabase
    .from("companies")
    .select(`
      id, name, lead_temperature, success_rating, estimated_value, created_at,
      industries(name),
      company_categories(name),
      pipeline_stages(name, color),
      assigned_profile:profiles!assigned_user_id(full_name, email)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  if (filters.industryId) {
    baseQuery = baseQuery.eq("industry_id", filters.industryId);
  }
  if (filters.pipelineStageId) {
    baseQuery = baseQuery.eq("pipeline_stage_id", filters.pipelineStageId);
  }
  if (filters.assignedUserId) {
    baseQuery = baseQuery.eq("assigned_user_id", filters.assignedUserId);
  }

  const { data: allLeads } = await baseQuery;

  const leads = allLeads || [];

  const industryMap: { [key: string]: number } = {};
  const categoryMap: { [key: string]: number } = {};
  const sourceMap: { [key: string]: number } = {};
  const userMap: { [key: string]: number } = {};

  leads.forEach((l: any) => {
    const industry = l.industries?.name || "Unassigned";
    industryMap[industry] = (industryMap[industry] || 0) + 1;

    const category = l.company_categories?.name || "Uncategorized";
    categoryMap[category] = (categoryMap[category] || 0) + 1;

    const source = l.lead_source || "Unknown";
    sourceMap[source] = (sourceMap[source] || 0) + 1;

    const user = l.assigned_profile?.full_name || l.assigned_profile?.email || "Unassigned";
    userMap[user] = (userMap[user] || 0) + 1;
  });

  const hotLeads = leads.filter((l: any) => l.lead_temperature === "hot" || l.lead_temperature === "very_hot");
  const recentlyAddedLeads = leads.filter((l: any) => {
    const created = new Date(l.created_at);
    return created >= start && created <= end;
  });

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: leadsWithFollowups } = await supabase
    .from("followups")
    .select("company_id")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const { data: leadsWithMeetings } = await supabase
    .from("interactions")
    .select("company_id")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("created_at", thirtyDaysAgo.toISOString());

  const followupCompanyIds = new Set((leadsWithFollowups || []).map((f: any) => f.company_id));
  const meetingCompanyIds = new Set((leadsWithMeetings || []).map((m: any) => m.company_id));

  const leadsWithoutFollowup = leads.filter((l: any) => !followupCompanyIds.has(l.id));
  const leadsWithoutMeeting = leads.filter((l: any) => !meetingCompanyIds.has(l.id));

  return {
    leadsByIndustry: Object.entries(industryMap).map(([industry, count]) => ({ industry, count })),
    leadsByCategory: Object.entries(categoryMap).map(([category, count]) => ({ category, count })),
    leadsBySource: Object.entries(sourceMap).map(([source, count]) => ({ source, count })),
    leadsByAssignedUser: Object.entries(userMap).map(([user, count]) => ({ user, count })),
    hotLeads,
    recentlyAddedLeads,
    leadsWithoutFollowup,
    leadsWithoutMeeting,
  };
}

export type PipelineReportData = {
  companiesByStage: { stage: string; count: number; color: string }[];
  pipelineValueByStage: { stage: string; value: number; color: string }[];
  avgRatingByStage: { stage: string; avgRating: number }[];
  wonLostCount: { won: number; lost: number };
  stuckLeads: any[];
  negotiationStageLeads: any[];
};

export async function getPipelineReport(filters: ReportFilters = {}): Promise<PipelineReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data: allCompanies } = await supabase
    .from("companies")
    .select(`
      id, estimated_value, success_rating,
      pipeline_stages(id, name, color, is_won, is_lost, position)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .order("pipeline_stages(position)");

  const companies = allCompanies || [];

  const stageMap: { [key: string]: { count: number; value: number; color: string; ratings: number[] } } = {};
  let wonCount = 0;
  let lostCount = 0;

  companies.forEach((c: any) => {
    const stage = c.pipeline_stages;
    if (!stage) return;

    const stageName = stage.name;
    if (!stageMap[stageName]) {
      stageMap[stageName] = { count: 0, value: 0, color: stage.color || "#888", ratings: [] };
    }
    stageMap[stageName].count++;
    stageMap[stageName].value += c.estimated_value || 0;
    if (c.success_rating) {
      stageMap[stageName].ratings.push(c.success_rating);
    }
    if (stage.is_won) wonCount++;
    if (stage.is_lost) lostCount++;
  });

  const companiesByStage = Object.entries(stageMap).map(([stage, data]) => ({
    stage,
    count: data.count,
    color: data.color,
  }));

  const pipelineValueByStage = Object.entries(stageMap).map(([stage, data]) => ({
    stage,
    value: data.value,
    color: data.color,
  }));

  const avgRatingByStage = Object.entries(stageMap)
    .filter(([, data]) => data.ratings.length > 0)
    .map(([stage, data]) => ({
      stage,
      avgRating: data.ratings.reduce((a, b) => a + b, 0) / data.ratings.length,
    }));

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentInteractions } = await supabase
    .from("interactions")
    .select("company_id, meeting_datetime")
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("meeting_datetime", thirtyDaysAgo.toISOString());

  const recentCompanyIds = new Set((recentInteractions || []).map((i: any) => i.company_id));
  const stuckLeads = companies.filter((c: any) => !recentCompanyIds.has(c.id) && !c.pipeline_stages?.is_won && !c.pipeline_stages?.is_lost);

  const negotiationStage = Object.values(stageMap).length > 0 ? "Negotiation" : null;
  const negotiationStageLeads = companies.filter((c: any) => {
    const stageName = c.pipeline_stages?.name?.toLowerCase() || "";
    return stageName.includes("negotiat") || stageName.includes("proposal");
  });

  return {
    companiesByStage,
    pipelineValueByStage,
    avgRatingByStage,
    wonLostCount: { won: wonCount, lost: lostCount },
    stuckLeads,
    negotiationStageLeads,
  };
}

export type MeetingReportData = {
  totalMeetings: number;
  meetingsByType: { type: string; count: number }[];
  meetingsBySalesperson: { user: string; count: number }[];
  avgSuccessRating: number;
  hotMeetings: any[];
  meetingsWithNextAction: any[];
  meetingsWithoutFollowup: any[];
};

export async function getMeetingReport(filters: ReportFilters = {}): Promise<MeetingReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  const { data: meetings } = await supabase
    .from("interactions")
    .select(`
      id, meeting_datetime, interaction_type, success_rating, lead_temperature, next_action, next_followup_date,
      companies(id, name),
      contact_persons(id, name),
      profiles!created_by(full_name, email)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("meeting_datetime", start.toISOString())
    .lte("meeting_datetime", end.toISOString())
    .order("meeting_datetime", { ascending: false });

  const allMeetings = meetings || [];

  const typeMap: { [key: string]: number } = {};
  const userMap: { [key: string]: number } = {};
  const ratings: number[] = [];

  allMeetings.forEach((m: any) => {
    typeMap[m.interaction_type] = (typeMap[m.interaction_type] || 0) + 1;
    const user = m.profiles?.full_name || m.profiles?.email || "Unknown";
    userMap[user] = (userMap[user] || 0) + 1;
    if (m.success_rating) ratings.push(m.success_rating);
  });

  const hotMeetings = allMeetings.filter((m: any) => m.lead_temperature === "hot" || m.lead_temperature === "very_hot");
  const meetingsWithNextAction = allMeetings.filter((m: any) => m.next_action);

  const { data: meetingsWithFollowups } = await supabase
    .from("followups")
    .select("interaction_id")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const followupInteractionIds = new Set((meetingsWithFollowups || []).map((f: any) => f.interaction_id));
  const meetingsWithoutFollowup = allMeetings.filter((m: any) => !followupInteractionIds.has(m.id));

  return {
    totalMeetings: allMeetings.length,
    meetingsByType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    meetingsBySalesperson: Object.entries(userMap).map(([user, count]) => ({ user, count })),
    avgSuccessRating: ratings.length > 0 ? ratings.reduce((a, b) => a + b, 0) / ratings.length : 0,
    hotMeetings,
    meetingsWithNextAction,
    meetingsWithoutFollowup,
  };
}

export type FollowupReportData = {
  todaysFollowups: any[];
  upcomingFollowups: any[];
  completedFollowups: any[];
  overdueFollowups: any[];
  completionRate: number;
  followupsByUser: { user: string; count: number }[];
  followupsByPriority: { priority: string; count: number }[];
  followupStatusDistribution: { status: string; count: number }[];
  followupCompletionTrend: { date: string; count: number }[];
};

export async function getFollowupReport(filters: ReportFilters = {}): Promise<FollowupReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  const now = new Date();
  const todayEnd = new Date(now);
  todayEnd.setHours(23, 59, 59, 999);

  const { data: allFollowups } = await supabase
    .from("followups")
    .select(`
      id, title, scheduled_at, completed_at, status, priority, followup_type,
      companies(id, name),
      assigned_profile:profiles!assigned_user_id(full_name, email),
      created_profile:profiles!created_by(full_name, email)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .order("scheduled_at", { ascending: true });

  const followups = allFollowups || [];

  const todaysFollowups = followups.filter((f: any) => {
    const sched = new Date(f.scheduled_at);
    return sched >= new Date(now.setHours(0, 0, 0, 0)) && sched <= todayEnd && f.status === "pending";
  });

  const upcomingFollowups = followups.filter((f: any) => {
    const sched = new Date(f.scheduled_at);
    return sched > todayEnd && sched <= end && f.status === "pending";
  });

  const completedFollowups = followups.filter((f: any) => {
    const completed = new Date(f.completed_at);
    return completed >= start && completed <= end && f.status === "completed";
  });

  const overdueFollowups = followups.filter((f: any) => {
    const sched = new Date(f.scheduled_at);
    return sched < now && f.status === "pending";
  });

  const userMap: { [key: string]: number } = {};
  const priorityMap: { [key: string]: number } = {};
  const statusMap: { [key: string]: number } = {};
  const completionTrend: { [key: string]: number } = {};

  followups.forEach((f: any) => {
    const user = f.assigned_profile?.full_name || f.assigned_profile?.email || "Unassigned";
    userMap[user] = (userMap[user] || 0) + 1;

    priorityMap[f.priority] = (priorityMap[f.priority] || 0) + 1;

    statusMap[f.status] = (statusMap[f.status] || 0) + 1;

    if (f.completed_at) {
      const dateKey = f.completed_at.slice(0, 10);
      completionTrend[dateKey] = (completionTrend[dateKey] || 0) + 1;
    }
  });

  const totalScheduled = followups.filter((f: any) => {
    const sched = new Date(f.scheduled_at);
    return sched >= start && sched <= end;
  }).length;
  const totalCompleted = completedFollowups.length;
  const completionRate = totalScheduled > 0 ? (totalCompleted / totalScheduled) * 100 : 0;

  return {
    todaysFollowups,
    upcomingFollowups,
    completedFollowups,
    overdueFollowups,
    completionRate,
    followupsByUser: Object.entries(userMap).map(([user, count]) => ({ user, count })),
    followupsByPriority: Object.entries(priorityMap).map(([priority, count]) => ({ priority, count })),
    followupStatusDistribution: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    followupCompletionTrend: Object.entries(completionTrend).map(([date, count]) => ({ date, count })),
  };
}

export type DocumentReportData = {
  totalDocuments: number;
  documentsByType: { type: string; count: number }[];
  documentsByStatus: { status: string; count: number }[];
  documentsByUser: { user: string; count: number }[];
  recentDocuments: any[];
};

export async function getDocumentReport(filters: ReportFilters = {}): Promise<DocumentReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  const { data: documents } = await supabase
    .from("documents")
    .select(`
      id, title, document_type, status, file_name, file_extension, file_size_mb, created_at,
      companies(id, name),
      uploaded_profile:profiles!uploaded_by(full_name, email)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  const allDocs = documents || [];

  const typeMap: { [key: string]: number } = {};
  const statusMap: { [key: string]: number } = {};
  const userMap: { [key: string]: number } = {};

  allDocs.forEach((d: any) => {
    typeMap[d.document_type] = (typeMap[d.document_type] || 0) + 1;
    statusMap[d.status] = (statusMap[d.status] || 0) + 1;
    const user = d.uploaded_profile?.full_name || d.uploaded_profile?.email || "Unknown";
    userMap[user] = (userMap[user] || 0) + 1;
  });

  return {
    totalDocuments: allDocs.length,
    documentsByType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    documentsByStatus: Object.entries(statusMap).map(([status, count]) => ({ status, count })),
    documentsByUser: Object.entries(userMap).map(([user, count]) => ({ user, count })),
    recentDocuments: allDocs.slice(0, 20),
  };
}

export type HelpRequestReportData = {
  openHelpRequests: number;
  urgentHelpRequests: number;
  resolvedRequests: number;
  helpRequestsByType: { type: string; count: number }[];
  helpRequestsByAssignedUser: { user: string; count: number }[];
  helpRequestsByPriority: { priority: string; count: number }[];
  recentHelpRequests: any[];
};

export async function getHelpRequestReport(filters: ReportFilters = {}): Promise<HelpRequestReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();
  const { start, end } = buildDateRange(filters);

  const { data: helpRequests } = await supabase
    .from("help_requests")
    .select(`
      id, title, help_type, priority, status, created_at,
      companies(id, name),
      requested_profile:profiles!requested_by(full_name, email),
      assigned_profile:profiles!assigned_to(full_name, email)
    `)
    .eq("organization_id", organization.id)
    .neq("status", "archived")
    .gte("created_at", start.toISOString())
    .lte("created_at", end.toISOString())
    .order("created_at", { ascending: false });

  const allRequests = helpRequests || [];

  const typeMap: { [key: string]: number } = {};
  const userMap: { [key: string]: number } = {};
  const priorityMap: { [key: string]: number } = {};

  let openCount = 0;
  let urgentCount = 0;
  let resolvedCount = 0;

  allRequests.forEach((r: any) => {
    typeMap[r.help_type] = (typeMap[r.help_type] || 0) + 1;
    priorityMap[r.priority] = (priorityMap[r.priority] || 0) + 1;

    const assignedUser = r.assigned_profile?.full_name || r.assigned_profile?.email || "Unassigned";
    userMap[assignedUser] = (userMap[assignedUser] || 0) + 1;

    if (r.status === "open" || r.status === "in_progress") openCount++;
    if (r.priority === "urgent") urgentCount++;
    if (r.status === "resolved") resolvedCount++;
  });

  return {
    openHelpRequests: openCount,
    urgentHelpRequests: urgentCount,
    resolvedRequests: resolvedCount,
    helpRequestsByType: Object.entries(typeMap).map(([type, count]) => ({ type, count })),
    helpRequestsByAssignedUser: Object.entries(userMap).map(([user, count]) => ({ user, count })),
    helpRequestsByPriority: Object.entries(priorityMap).map(([priority, count]) => ({ priority, count })),
    recentHelpRequests: allRequests.slice(0, 50),
  };
}

export type TeamPerformanceReportData = {
  teamStats: {
    userId: string;
    userName: string;
    userEmail: string;
    assignedCompanies: number;
    meetingsCreated: number;
    followupsCreated: number;
    followupsCompleted: number;
    overdueFollowups: number;
    documentsUploaded: number;
    helpRequestsCreated: number;
    helpRequestsResolved: number;
    hotLeadsManaged: number;
    pipelineValueManaged: number;
  }[];
};

export async function getTeamPerformanceReport(filters: ReportFilters = {}): Promise<TeamPerformanceReportData> {
  const organization = await requireOrganization();
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, full_name, email")
    .eq("organization_id", organization.id);

  const { data: companies } = await supabase
    .from("companies")
    .select("assigned_user_id, estimated_value, lead_temperature")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const { data: meetings } = await supabase
    .from("interactions")
    .select("created_by")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const { data: followups } = await supabase
    .from("followups")
    .select("assigned_user_id, status, created_by")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const { data: documents } = await supabase
    .from("documents")
    .select("uploaded_by")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const { data: helpRequests } = await supabase
    .from("help_requests")
    .select("requested_by, assigned_to")
    .eq("organization_id", organization.id)
    .neq("status", "archived");

  const teamStats = (profiles || []).map((profile: any) => {
    const userCompanies = (companies || []).filter((c: any) => c.assigned_user_id === profile.id);
    const userMeetings = (meetings || []).filter((m: any) => m.created_by === profile.id);
    const userFollowupsCreated = (followups || []).filter((f: any) => f.created_by === profile.id);
    const userFollowupsCompleted = userFollowupsCreated.filter((f: any) => f.status === "completed");
    const userOverdueFollowups = userFollowupsCreated.filter((f: any) => {
      const sched = new Date(f.scheduled_at);
      return f.status === "pending" && sched < new Date();
    });
    const userDocuments = (documents || []).filter((d: any) => d.uploaded_by === profile.id);
    const userHelpRequestsCreated = (helpRequests || []).filter((h: any) => h.requested_by === profile.id);
    const userHelpRequestsResolved = (helpRequests || []).filter((h: any) => h.assigned_to === profile.id && h.status === "resolved");
    const userHotLeads = userCompanies.filter((c: any) => c.lead_temperature === "hot" || c.lead_temperature === "very_hot");
    const userPipelineValue = userCompanies.reduce((sum: number, c: any) => sum + (c.estimated_value || 0), 0);

    return {
      userId: profile.id,
      userName: profile.full_name || "Unknown",
      userEmail: profile.email,
      assignedCompanies: userCompanies.length,
      meetingsCreated: userMeetings.length,
      followupsCreated: userFollowupsCreated.length,
      followupsCompleted: userFollowupsCompleted.length,
      overdueFollowups: userOverdueFollowups.length,
      documentsUploaded: userDocuments.length,
      helpRequestsCreated: userHelpRequestsCreated.length,
      helpRequestsResolved: userHelpRequestsResolved.length,
      hotLeadsManaged: userHotLeads.length,
      pipelineValueManaged: userPipelineValue,
    };
  });

  return { teamStats };
}