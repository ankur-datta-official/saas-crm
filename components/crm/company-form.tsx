"use client";

import { useState, useTransition } from "react";
import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { companySchema, type CompanyFormValues } from "@/lib/crm/schemas";
import type { Company, CompanyCategory, Industry, PipelineStage, TeamMemberOption } from "@/lib/crm/types";
import { createCompanyAction, updateCompanyAction } from "@/lib/crm/actions";

type CompanyFormProps = {
  company?: Company;
  industries: Industry[];
  categories: CompanyCategory[];
  stages: PipelineStage[];
  teamMembers: TeamMemberOption[];
};

export function CompanyForm({ company, industries, categories, stages, teamMembers }: CompanyFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [serverFieldErrors, setServerFieldErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const form = useForm<CompanyFormValues>({
    resolver: zodResolver(companySchema),
    defaultValues: {
      name: company?.name ?? "",
      industry_id: company?.industry_id ?? "",
      category_id: company?.category_id ?? "",
      lead_source: company?.lead_source ?? "",
      priority: company?.priority ?? "medium",
      assigned_user_id: company?.assigned_user_id ?? "",
      pipeline_stage_id: company?.pipeline_stage_id ?? stages[0]?.id ?? "",
      status: company?.status ?? "active",
      phone: company?.phone ?? "",
      whatsapp: company?.whatsapp ?? "",
      email: company?.email ?? "",
      website: company?.website ?? "",
      address: company?.address ?? "",
      city: company?.city ?? "",
      country: company?.country ?? "",
      success_rating: company?.success_rating ?? "",
      lead_temperature: company?.lead_temperature ?? "warm",
      estimated_value: company?.estimated_value ?? "",
      expected_closing_date: company?.expected_closing_date ?? "",
      notes: company?.notes ?? "",
    },
  });

  function onSubmit(values: CompanyFormValues, mode: "save" | "addAnother" = "save") {
    setServerError(null);
    setSuccessMessage(null);
    setServerFieldErrors({});
    startTransition(async () => {
      const result = company ? await updateCompanyAction(company.id, values) : await createCompanyAction(values);
      if (!result?.ok) {
        setServerError(result?.error ?? "Please check the highlighted fields and try again.");
        setServerFieldErrors(result?.fieldErrors ?? {});
        return;
      }

      if (mode === "addAnother" && !company) {
        form.reset({
          name: "",
          industry_id: "",
          category_id: "",
          lead_source: "",
          priority: "medium",
          assigned_user_id: "",
          pipeline_stage_id: stages[0]?.id ?? "",
          status: "active",
          phone: "",
          whatsapp: "",
          email: "",
          website: "",
          address: "",
          city: "",
          country: "",
          success_rating: "",
          lead_temperature: "warm",
          estimated_value: "",
          expected_closing_date: "",
          notes: "",
        });
        setSuccessMessage("Company saved. You can add another lead now.");
        return;
      }

      router.push(`/companies/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit(values, "save"))}>
      <p className="rounded-md border bg-white p-3 text-sm text-muted-foreground">
        Only basic information is required. You can add more details later.
      </p>
      <FormSection title="Basic Information" description="Core lead classification, ownership, and pipeline placement.">
        <Field label="Company name" required error={form.formState.errors.name?.message}>
          <Input {...form.register("name")} placeholder="Acme Enterprise" />
        </Field>
        <SelectField
          label="Industry"
          error={form.formState.errors.industry_id?.message ?? serverFieldErrors.industry_id}
          helper={<Link className="text-xs font-medium text-primary hover:underline" href="/settings/industries">Add industry</Link>}
          {...form.register("industry_id")}
        >
          <option value="">
            {industries.length === 0 ? "No industries found. Add one in Settings > Industries." : "Select industry"}
          </option>
          {industries.map((industry) => <option key={industry.id} value={industry.id}>{industry.name}</option>)}
        </SelectField>
        <SelectField label="Company category" error={serverFieldErrors.category_id} {...form.register("category_id")}>
          <option value="">Select category</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.code} - {category.name}</option>)}
        </SelectField>
        <Field label="Lead source">
          <Input {...form.register("lead_source")} placeholder="Referral, Website, LinkedIn" />
        </Field>
        <SelectField label="Priority" {...form.register("priority")}>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="urgent">Urgent</option>
        </SelectField>
        <SelectField label="Assigned user" error={serverFieldErrors.assigned_user_id} {...form.register("assigned_user_id")}>
          <option value="">Unassigned</option>
          {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name ?? member.email}</option>)}
        </SelectField>
        <SelectField label="Pipeline stage" error={serverFieldErrors.pipeline_stage_id} {...form.register("pipeline_stage_id")}>
          <option value="">No stage</option>
          {stages.map((stage) => <option key={stage.id} value={stage.id}>{stage.name}</option>)}
        </SelectField>
        <SelectField label="Status" {...form.register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
      </FormSection>

      <CollapsibleSection title="Contact Information" description="Public contact channels and location details.">
        <Field label="Phone"><Input {...form.register("phone")} /></Field>
        <Field label="WhatsApp"><Input {...form.register("whatsapp")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message ?? serverFieldErrors.email}><Input {...form.register("email")} /></Field>
        <Field label="Website" error={form.formState.errors.website?.message ?? serverFieldErrors.website}><Input {...form.register("website")} placeholder="https://example.com" /></Field>
        <Field label="Address"><Input {...form.register("address")} /></Field>
        <Field label="City"><Input {...form.register("city")} /></Field>
        <Field label="Country"><Input {...form.register("country")} /></Field>
      </CollapsibleSection>

      <CollapsibleSection title="Sales Information" description="Qualification, value, temperature, and expected close timing.">
        <Field label="Success rating" error={form.formState.errors.success_rating?.message ?? serverFieldErrors.success_rating}>
          <Input type="number" min={1} max={10} {...form.register("success_rating")} />
        </Field>
        <SelectField label="Lead temperature" {...form.register("lead_temperature")}>
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
          <option value="very_hot">Very Hot</option>
        </SelectField>
        <Field label="Estimated value" error={form.formState.errors.estimated_value?.message ?? serverFieldErrors.estimated_value}>
          <Input type="number" min={0} step="0.01" {...form.register("estimated_value")} />
        </Field>
        <Field label="Expected closing date">
          <Input type="date" {...form.register("expected_closing_date")} />
        </Field>
      </CollapsibleSection>

      <CollapsibleSection title="Additional Notes" description="Internal context for qualification and next action planning." columns="grid-cols-1">
        <div className="space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <textarea
            id="notes"
            {...form.register("notes")}
            className="min-h-32 w-full rounded-md border bg-background px-3 py-2 text-sm"
            placeholder="Capture relationship context, requirements, risks, and decision notes."
          />
        </div>
      </CollapsibleSection>

      {serverError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p> : null}
      {successMessage ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p> : null}
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
          <Save />
          {company ? "Update company" : "Save"}
        </Button>
        {!company ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || form.formState.isSubmitting}
            onClick={form.handleSubmit((values) => onSubmit(values, "addAnother"))}
          >
            Save & Add Another
          </Button>
        ) : null}
        <Button asChild variant="outline">
          <Link href={company ? `/companies/${company.id}` : "/companies"}>Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function FormSection({
  title,
  description,
  children,
  columns = "md:grid-cols-2 xl:grid-cols-4",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  columns?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className={`grid gap-4 ${columns}`}>{children}</CardContent>
    </Card>
  );
}

function CollapsibleSection({
  title,
  description,
  children,
  columns = "md:grid-cols-2 xl:grid-cols-4",
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  columns?: string;
}) {
  return (
    <details className="rounded-lg border bg-card text-card-foreground shadow-soft">
      <summary className="cursor-pointer list-none p-5">
        <h3 className="text-base font-semibold">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </summary>
      <div className={`grid gap-4 p-5 pt-0 ${columns}`}>{children}</div>
    </details>
  );
}

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      {children}
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}

function SelectField({
  label,
  error,
  helper,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; error?: string; helper?: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Label>{label}</Label>
        {helper}
      </div>
      <select {...props} className="h-10 w-full rounded-md border bg-background px-3 text-sm">
        {children}
      </select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
