import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  CircleDollarSign,
  Flame,
  Handshake,
  LifeBuoy,
  LineChart,
  Plus,
  Target,
  TimerOff,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/components/shared/stat-card";
import { UsageProgressBar } from "@/components/subscription/usage-progress-bar";
import { getCurrentProfile, requireOrganization } from "@/lib/auth/session";
import {
  getDashboardMetrics,
  getDashboardSetupCounts,
  getPipelineCompanies,
  getPipelineStagesForBoard,
  getPipelineSummary,
} from "@/lib/crm/queries";
import { getFollowups } from "@/lib/crm/followup-queries";
import { getOpenHelpRequestsCount, getHelpRequests } from "@/lib/crm/help-request-queries";
import { formatCurrency } from "@/lib/crm/utils";
import { getCurrentPlan, getOrganizationUsage } from "@/lib/subscription/subscription-queries";
import type { Followup, HelpRequest, PipelineBoardCompany, PipelineStage } from "@/lib/crm/types";
import { getDisplayName } from "@/lib/utils";

export default async function DashboardPage() {
  const organization = await requireOrganization();
  const profile = await getCurrentProfile();
  const [
    metrics,
    openHelpRequestsCount,
    currentPlan,
    usage,
    setupCounts,
    pipelineCompanies,
    pipelineStages,
    pendingFollowups,
    helpRequests,
  ] = await Promise.all([
    getDashboardMetrics(),
    getOpenHelpRequestsCount(),
    getCurrentPlan(),
    getOrganizationUsage(),
    getDashboardSetupCounts(),
    getPipelineCompanies(),
    getPipelineStagesForBoard(),
    getFollowups({ status: "pending" }),
    getHelpRequests({}),
  ]);

  const pipelineSummary = await getPipelineSummary(pipelineCompanies);
  const displayName = getDisplayName(profile?.full_name, profile?.email, "there");
  const today = getDateBounds();

  const todaysFollowups = pendingFollowups
    .filter((followup) => {
      const time = new Date(followup.scheduled_at).getTime();
      return time >= today.start.getTime() && time <= today.end.getTime();
    })
    .slice(0, 5);

  const overdueFollowups = pendingFollowups
    .filter((followup) => new Date(followup.scheduled_at).getTime() < today.start.getTime())
    .slice(0, 5);

  const openHelpRequests = helpRequests
    .filter((request) => request.status === "open" || request.status === "in_progress")
    .slice(0, 5);

  const showGettingStarted =
    metrics.totalCompanies <= 1 || setupCounts.meetings === 0 || setupCounts.followups === 0;

  const firstStageId = pipelineStages[0]?.id ?? null;
  const movedDeals = pipelineCompanies.filter(
    (company) => company.pipeline_stage_id && firstStageId && company.pipeline_stage_id !== firstStageId,
  ).length;

  const gettingStartedSteps = [
    {
      title: "Add your first lead",
      description: "Create a company or lead so the CRM has something to track.",
      href: "/companies/new",
      completed: setupCounts.companies > 0,
    },
    {
      title: "Add contact person",
      description: "Attach a decision-maker or primary contact to your lead.",
      href: "/contacts/new",
      completed: setupCounts.contacts > 0,
    },
    {
      title: "Log first meeting",
      description: "Capture your first client call, demo, or meeting note.",
      href: "/meetings/new",
      completed: setupCounts.meetings > 0,
    },
    {
      title: "Create follow-up",
      description: "Set the next action so your pipeline keeps moving.",
      href: "/followups/new",
      completed: setupCounts.followups > 0,
    },
    {
      title: "Move deal in pipeline",
      description: "Advance a lead to the next stage as progress happens.",
      href: "/pipeline",
      completed: movedDeals > 0,
    },
  ];

  const stageSnapshot = pipelineStages
    .map((stage) => ({
      stage,
      count: pipelineCompanies.filter((company) => company.pipeline_stage_id === stage.id).length,
      value: pipelineCompanies
        .filter((company) => company.pipeline_stage_id === stage.id)
        .reduce((total, company) => total + Number(company.estimated_value ?? 0), 0),
    }))
    .filter((item) => item.count > 0)
    .slice(0, 5);

  const kpis = [
    {
      title: "Total Leads",
      value: String(metrics.totalCompanies),
      description: "All active companies and leads in your workspace",
      icon: Users,
      tone: "teal" as const,
      href: "/companies",
    },
    {
      title: "Active Deals",
      value: String(pipelineSummary.totalActiveDeals),
      description: "Deals still in motion across the pipeline",
      icon: Target,
      tone: "blue" as const,
      href: "/pipeline",
    },
    {
      title: "Today's Follow-ups",
      value: String(metrics.todaysFollowups),
      description: "Actions due before the day ends",
      icon: CalendarClock,
      tone: "amber" as const,
      href: "/followups",
    },
    {
      title: "Overdue Follow-ups",
      value: String(metrics.missedFollowups),
      description: "Pending actions that need immediate review",
      icon: TimerOff,
      tone: "rose" as const,
      href: "/followups",
    },
    {
      title: "Pipeline Value",
      value: formatCurrency(metrics.pipelineValue),
      description: "Estimated open deal value across your CRM",
      icon: CircleDollarSign,
      tone: "slate" as const,
      href: "/pipeline",
    },
    {
      title: "Open Help Requests",
      value: String(openHelpRequestsCount),
      description: "Blocked deals or requests waiting on support",
      icon: LifeBuoy,
      tone: "amber" as const,
      href: "/need-help",
    },
  ];

  const isCaughtUp =
    todaysFollowups.length === 0 && overdueFollowups.length === 0 && openHelpRequests.length === 0;

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border bg-gradient-to-br from-white via-white to-slate-50">
        <div className="flex flex-col gap-6 p-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 space-y-3">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">Welcome back</p>
              <h1 className="text-3xl font-semibold tracking-normal text-slate-900 sm:text-4xl">
                {displayName}
              </h1>
            </div>
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-700">{organization.name}</p>
              <p className="max-w-2xl text-sm text-slate-600">
                Here&apos;s what needs attention across your CRM today.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/companies/new">
                <Plus />
                Add Lead
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/meetings/new">Log Meeting</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/followups/new">Create Follow-up</Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {kpis.map((kpi) => (
          <StatCard key={kpi.title} {...kpi} />
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Today&apos;s Focus</CardTitle>
            <CardDescription className="text-slate-600">
              Start here to keep momentum on follow-ups, blocked deals, and urgent work.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isCaughtUp ? (
              <div className="rounded-2xl border border-dashed bg-slate-50 px-6 py-10 text-center">
                <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
                  <CheckCircle2 className="size-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-slate-900">You’re all caught up for today.</h3>
                <p className="mx-auto mt-2 max-w-2xl text-sm text-slate-600">
                  No overdue follow-ups, no scheduled follow-ups left today, and no open help requests need attention right now.
                </p>
                <Button asChild className="mt-5">
                  <Link href="/pipeline">View Pipeline</Link>
                </Button>
              </div>
            ) : (
              <div className="grid gap-4 lg:grid-cols-3">
                <FocusListCard
                  title="Today’s Follow-ups"
                  description="Scheduled for today"
                  href="/followups"
                  emptyLabel="No follow-ups due today."
                  items={todaysFollowups}
                  renderItem={(followup) => (
                    <DashboardLinkRow
                      key={followup.id}
                      title={followup.title}
                      subtitle={`${followup.companies?.name ?? "No company"} • ${formatDateTime(followup.scheduled_at)}`}
                      href={`/followups/${followup.id}`}
                    />
                  )}
                />
                <FocusListCard
                  title="Overdue Follow-ups"
                  description="Needs immediate review"
                  href="/followups"
                  emptyLabel="No overdue follow-ups."
                  items={overdueFollowups}
                  renderItem={(followup) => (
                    <DashboardLinkRow
                      key={followup.id}
                      title={followup.title}
                      subtitle={`${followup.companies?.name ?? "No company"} • ${formatDateTime(followup.scheduled_at)}`}
                      href={`/followups/${followup.id}`}
                      tone="danger"
                    />
                  )}
                />
                <FocusListCard
                  title="Open Help Requests"
                  description="Support or escalation needed"
                  href="/need-help"
                  emptyLabel="No open help requests."
                  items={openHelpRequests}
                  renderItem={(request) => (
                    <DashboardLinkRow
                      key={request.id}
                      title={request.title}
                      subtitle={`${request.companies?.name ?? "No company"} • ${toSentenceCase(request.status)}`}
                      href={`/need-help/${request.id}`}
                    />
                  )}
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <CardTitle className="text-slate-900">Pipeline Snapshot</CardTitle>
            <CardDescription className="text-slate-600">
              A clean read on current deal value, heat, and stage concentration.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <MiniMetric
                label="Pipeline value"
                value={formatCurrency(pipelineSummary.totalPipelineValue)}
                icon={LineChart}
              />
              <MiniMetric
                label="Active deals"
                value={String(pipelineSummary.totalActiveDeals)}
                icon={Handshake}
              />
              <MiniMetric
                label="Hot / Very hot"
                value={String(pipelineSummary.hotLeads)}
                icon={Flame}
              />
              <MiniMetric
                label="Won deals"
                value={String(pipelineSummary.wonDeals)}
                icon={CheckCircle2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-slate-900">Stage Breakdown</h3>
                <Button asChild variant="ghost" size="sm">
                  <Link href="/pipeline">
                    View Pipeline
                    <ArrowRight />
                  </Link>
                </Button>
              </div>

              {stageSnapshot.length === 0 ? (
                <div className="rounded-xl border border-dashed px-4 py-5 text-sm text-slate-600">
                  No active deals are in the pipeline yet.
                </div>
              ) : (
                <div className="space-y-2">
                  {stageSnapshot.map(({ stage, count, value }) => (
                    <div key={stage.id} className="flex items-center justify-between rounded-xl border px-4 py-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="size-2.5 rounded-full" style={{ backgroundColor: stage.color }} />
                          <p className="truncate text-sm font-medium text-slate-900">{stage.name}</p>
                        </div>
                        <p className="mt-1 text-xs text-slate-500">{count} deal{count === 1 ? "" : "s"}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">{formatCurrency(value)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
        {showGettingStarted ? (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Getting Started</CardTitle>
              <CardDescription className="text-slate-600">
                Follow these steps to turn the CRM into a daily workflow for your team.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {gettingStartedSteps.map((step) => (
                <div key={step.title} className="flex flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      {step.completed ? (
                        <CheckCircle2 className="size-4 text-emerald-600" />
                      ) : (
                        <span className="size-4 rounded-full border border-slate-300" />
                      )}
                      <p className="text-sm font-medium text-slate-900">{step.title}</p>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{step.description}</p>
                  </div>
                  <Button asChild variant={step.completed ? "ghost" : "outline"} size="sm">
                    <Link href={step.href}>{step.completed ? "Review" : "Start"}</Link>
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle className="text-slate-900">Momentum Check</CardTitle>
              <CardDescription className="text-slate-600">
                Your CRM has enough activity to skip setup mode. Keep the pipeline moving and review the next actions.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-3 sm:grid-cols-3">
              <MiniMetric label="Contacts" value={String(setupCounts.contacts)} icon={Users} />
              <MiniMetric label="Meetings logged" value={String(setupCounts.meetings)} icon={CalendarClock} />
              <MiniMetric label="Follow-ups created" value={String(setupCounts.followups)} icon={Handshake} />
            </CardContent>
          </Card>
        )}

        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex items-center justify-between gap-3">
              <div>
                <CardTitle className="text-slate-900">Plan Usage</CardTitle>
                <CardDescription className="text-slate-600">
                  {currentPlan ? `${currentPlan.name} plan snapshot` : "Subscription details are not available right now."}
                </CardDescription>
              </div>
              <Button asChild variant="ghost" size="sm">
                <Link href="/subscription">Manage subscription</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <CompactUsageRow
              label="Users"
              used={usage.reservedSeats}
              limit={currentPlan?.max_users ?? null}
            />
            <CompactUsageRow
              label="Companies"
              used={usage.companies}
              limit={currentPlan?.max_companies ?? null}
            />
            <CompactUsageRow
              label="Storage"
              used={Number(usage.storageUsedMb.toFixed(2))}
              limit={currentPlan?.storage_limit_mb ?? null}
              unit="MB"
            />
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

function FocusListCard<T>({
  title,
  description,
  href,
  emptyLabel,
  items,
  renderItem,
}: {
  title: string;
  description: string;
  href: string;
  emptyLabel: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
}) {
  return (
    <div className="rounded-xl border bg-slate-50/50 p-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-medium text-slate-900">{title}</h3>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href={href}>View all</Link>
        </Button>
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-lg border border-dashed px-3 py-4 text-sm text-slate-500">{emptyLabel}</div>
        ) : (
          items.map(renderItem)
        )}
      </div>
    </div>
  );
}

function DashboardLinkRow({
  title,
  subtitle,
  href,
  tone = "default",
}: {
  title: string;
  subtitle: string;
  href: string;
  tone?: "default" | "danger";
}) {
  return (
    <Link
      href={href}
      className="block rounded-lg border bg-white px-3 py-3 transition-colors hover:border-primary/40 hover:bg-primary/5"
    >
      <p className={`text-sm font-medium ${tone === "danger" ? "text-rose-700" : "text-slate-900"}`}>{title}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Link>
  );
}

function MiniMetric({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <div className="rounded-xl border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm text-slate-600">{label}</p>
        <div className="flex size-9 items-center justify-center rounded-lg bg-slate-100 text-slate-600">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function CompactUsageRow({
  label,
  used,
  limit,
  unit = "",
}: {
  label: string;
  used: number;
  limit: number | null;
  unit?: string;
}) {
  const suffix = unit ? ` ${unit}` : "";
  return (
    <div className="space-y-2 rounded-xl border px-4 py-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-900">{label}</p>
        <p className="text-sm text-slate-500">
          {limit === null ? `Unlimited${suffix}` : `${limit.toLocaleString()}${suffix}`}
        </p>
      </div>
      <div className="flex items-end justify-between gap-3">
        <p className="text-2xl font-semibold text-slate-900">
          {unit === "MB" ? used.toFixed(2) : used.toLocaleString()}
          <span className="ml-1 text-sm font-normal text-slate-500">{suffix}</span>
        </p>
      </div>
      <UsageProgressBar value={used} max={limit} />
    </div>
  );
}

function getDateBounds() {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function toSentenceCase(value: string) {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
