import type { ReactNode } from "react";
import Link from "next/link";
import { BriefcaseBusiness, Building2, CheckCircle2, Circle, KanbanSquare, UserRound } from "lucide-react";
import { CrmSettingsCard } from "@/components/crm/crm-settings-card";
import { PageHeader } from "@/components/shared/page-header";
import { GuidanceStrip } from "@/components/shared/guidance-strip";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { requireAnyPermission } from "@/lib/auth/session";
import { getCurrentProfileSettings } from "@/lib/profile/profile-actions";
import { getCompanyCategories, getIndustries, getPipelineStages } from "@/lib/crm/queries";

export default async function SettingsPage() {
  await requireAnyPermission(["settings.view", "settings.manage"]);
  const [profile, industries, categories, pipelineStages] = await Promise.all([
    getCurrentProfileSettings(),
    getIndustries(),
    getCompanyCategories(),
    getPipelineStages(),
  ]);

  const setupChecklist = [
    {
      label: "Profile completed",
      done: Boolean(profile.fullName?.trim()),
      detail: profile.fullName?.trim() ? "Your account details are ready." : "Add your name and contact details.",
    },
    {
      label: "Industries configured",
      done: industries.length > 0,
      detail: industries.length > 0 ? `${industries.length} industry labels available.` : "Add segmentation labels for your leads.",
    },
    {
      label: "Company categories ready",
      done: categories.length > 0,
      detail: categories.length > 0 ? `${categories.length} categories available.` : "Define lead tiers and priority groups.",
    },
    {
      label: "Pipeline stages ready",
      done: pipelineStages.length > 0,
      detail: pipelineStages.length > 0 ? `${pipelineStages.length} active stages in use.` : "Set up your deal workflow stages.",
    },
  ];

  const completedCount = setupChecklist.filter((item) => item.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your profile, CRM base data, and sales workflow preferences."
        actions={(
          <Button asChild variant="outline">
            <Link href="/settings/profile">View Profile</Link>
          </Button>
        )}
      />
      <GuidanceStrip dismissible storageKey="crm-tip-settings">
        Set up your profile, CRM options, and pipeline stages so your team works with the right data from day one.
      </GuidanceStrip>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          <SettingsSection
            title="Account & Workspace"
            description="Personalize how you appear across the CRM and keep your account details current."
          >
            <CrmSettingsCard
              title="Profile Settings"
              description="Update your name, avatar, contact details, and personal CRM preferences."
              href="/settings/profile"
              icon={UserRound}
              ctaLabel="Manage Profile"
              badge="Personal"
              meta="Account and identity"
            />
          </SettingsSection>

          <SettingsSection
            title="CRM Data Setup"
            description="Keep lead segmentation and qualification labels organized for your team and reports."
          >
            <CrmSettingsCard
              title="Industries"
              description="Manage industry labels used for lead segmentation and reports."
              href="/settings/industries"
              icon={BriefcaseBusiness}
              ctaLabel="Manage Industries"
              badge="CRM Data"
              meta={`${industries.length} active labels`}
            />
            <CrmSettingsCard
              title="Company Categories"
              description="Define value tiers and priority categories for better lead qualification."
              href="/settings/company-categories"
              icon={Building2}
              ctaLabel="Manage Categories"
              badge="CRM Data"
              meta={`${categories.length} active categories`}
            />
          </SettingsSection>

          <SettingsSection
            title="Sales Workflow"
            description="Tune the stages and probabilities your team relies on to track deals consistently."
          >
            <CrmSettingsCard
              title="Pipeline"
              description="Customize sales stages, probabilities, and stage colors for your deal flow."
              href="/settings/pipeline"
              icon={KanbanSquare}
              ctaLabel="Manage Pipeline"
              badge="Workflow"
              meta={`${pipelineStages.length} active stages`}
            />
          </SettingsSection>
        </div>

        <Card className="h-fit border-slate-200 bg-white">
          <CardHeader className="pb-4">
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2">
                <CardTitle>Setup Checklist</CardTitle>
                <CardDescription>Review the essentials your admins usually complete first.</CardDescription>
              </div>
              <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-3 py-2 text-right">
                <p className="text-lg font-semibold text-emerald-700">{completedCount}/4</p>
                <p className="text-xs font-medium uppercase tracking-wide text-emerald-600">Completed</p>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {setupChecklist.map((item) => (
              <div key={item.label} className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
                <div className="mt-0.5 shrink-0 text-primary">
                  {item.done ? <CheckCircle2 className="size-5 text-emerald-600" /> : <Circle className="size-5 text-slate-300" />}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-900">{item.label}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-500">{item.detail}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SettingsSection({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm leading-6 text-slate-600">{description}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        {children}
      </div>
    </section>
  );
}
