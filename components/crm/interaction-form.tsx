"use client";

import type React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormActionBar, FormContextHint, FormRequiredNote } from "@/components/shared/form-helpers";
import { createInteractionAction, updateInteractionAction } from "@/lib/crm/actions";
import { interactionSchema, interactionTypeOptions, temperatureFromRating, type InteractionFormValues } from "@/lib/crm/schemas";
import type { Company, ContactPerson, Interaction, TeamMemberOption } from "@/lib/crm/types";

type InteractionFormProps = {
  interaction?: Interaction;
  companies: Company[];
  contacts: ContactPerson[];
  teamMembers: TeamMemberOption[];
  defaultCompanyId?: string;
};

export function InteractionForm({ interaction, companies, contacts, teamMembers, defaultCompanyId }: InteractionFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [temperatureTouched, setTemperatureTouched] = useState(Boolean(interaction?.lead_temperature));
  const [isPending, startTransition] = useTransition();
  const form = useForm<InteractionFormValues>({
    resolver: zodResolver(interactionSchema),
    defaultValues: {
      company_id: interaction?.company_id ?? defaultCompanyId ?? "",
      contact_person_id: interaction?.contact_person_id ?? "",
      assigned_user_id: interaction?.assigned_user_id ?? "",
      interaction_type: interaction?.interaction_type ?? "Phone Call",
      meeting_datetime: interaction?.meeting_datetime ? interaction.meeting_datetime.slice(0, 16) : getLocalDateTimeValue(),
      location: interaction?.location ?? "",
      online_meeting_link: interaction?.online_meeting_link ?? "",
      discussion_details: interaction?.discussion_details ?? "",
      client_requirement: interaction?.client_requirement ?? "",
      pain_point: interaction?.pain_point ?? "",
      proposed_solution: interaction?.proposed_solution ?? "",
      budget_discussion: interaction?.budget_discussion ?? "",
      competitor_mentioned: interaction?.competitor_mentioned ?? "",
      decision_timeline: interaction?.decision_timeline ?? "",
      success_rating: interaction?.success_rating ?? "",
      lead_temperature: interaction?.lead_temperature ?? "",
      next_action: interaction?.next_action ?? "",
      next_followup_at: interaction?.next_followup_at ? interaction.next_followup_at.slice(0, 16) : "",
      need_help: interaction?.need_help ?? false,
      internal_note: interaction?.internal_note ?? "",
      status: interaction?.status ?? "active",
    },
  });
  const selectedCompanyId = form.watch("company_id");
  const availableContacts = contacts.filter((contact) => contact.company_id === selectedCompanyId);

  function onSubmit(values: InteractionFormValues, mode: "save" | "addAnother" = "save") {
    setServerError(null);
    setSuccessMessage(null);
    setFieldErrors({});
    startTransition(async () => {
      const result = interaction ? await updateInteractionAction(interaction.id, values) : await createInteractionAction(values);
      if (!result.ok) {
        setServerError(result.error ?? "Unable to save meeting.");
        setFieldErrors(result.fieldErrors ?? {});
        return;
      }
      if (mode === "addAnother" && !interaction) {
        const companyId = values.company_id;
        form.reset({ company_id: companyId, contact_person_id: "", assigned_user_id: "", interaction_type: "Phone Call", meeting_datetime: getLocalDateTimeValue(), discussion_details: "", need_help: false, status: "active" });
        setSuccessMessage("Meeting saved. You can add another interaction now.");
        return;
      }
      router.push(`/meetings/${result.id}`);
      router.refresh();
    });
  }

  function handleRatingChange(event: React.ChangeEvent<HTMLInputElement>) {
    const rating = Number(event.target.value);
    if (!temperatureTouched) {
      form.setValue("lead_temperature", temperatureFromRating(Number.isFinite(rating) ? rating : null) ?? "");
    }
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit(values, "save"))}>
      <FormRequiredNote message="Company and discussion details are required. The meeting date is prefilled with the current time so you can log calls and conversations quickly." />
      {defaultCompanyId && !interaction ? (
        <FormContextHint message="This meeting was started from a company page, so the company is preselected." />
      ) : null}
      <FormSection title="Basic Information" description="Required company context and discussion notes.">
        <SelectField label="Company" required error={form.formState.errors.company_id?.message ?? fieldErrors.company_id} {...form.register("company_id")}>
          <option value="">Select company</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </SelectField>
        <SelectField label="Contact Person" error={fieldErrors.contact_person_id} {...form.register("contact_person_id")}>
          <option value="">No contact selected</option>
          {availableContacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.name}</option>)}
        </SelectField>
        <SelectField label="Interaction Type" {...form.register("interaction_type")}>
          {interactionTypeOptions.map((type) => <option key={type} value={type}>{type}</option>)}
        </SelectField>
        <Field label="Discussion Details" required error={form.formState.errors.discussion_details?.message}>
          <textarea {...form.register("discussion_details")} className="min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm" />
        </Field>
      </FormSection>

      <CollapsibleSection title="Meeting Context" description="When and where the interaction happened.">
        <Field label="Meeting Date & Time"><Input type="datetime-local" {...form.register("meeting_datetime")} /></Field>
        <Field label="Location"><Input {...form.register("location")} /></Field>
        <Field label="Online Meeting Link" error={form.formState.errors.online_meeting_link?.message}><Input {...form.register("online_meeting_link")} placeholder="https://meet.example.com" /></Field>
        <SelectField label="Assigned user" error={fieldErrors.assigned_user_id} {...form.register("assigned_user_id")}>
          <option value="">Unassigned</option>
          {teamMembers.map((member) => <option key={member.id} value={member.id}>{member.full_name ?? member.email}</option>)}
        </SelectField>
      </CollapsibleSection>

      <CollapsibleSection title="Client Requirement" description="Capture client needs, pain points, and proposed direction.">
        <Field label="Client Requirement"><Input {...form.register("client_requirement")} /></Field>
        <Field label="Pain Point"><Input {...form.register("pain_point")} /></Field>
        <Field label="Proposed Solution"><Input {...form.register("proposed_solution")} /></Field>
        <Field label="Budget Discussion"><Input {...form.register("budget_discussion")} /></Field>
        <Field label="Competitor Mentioned"><Input {...form.register("competitor_mentioned")} /></Field>
        <Field label="Decision Timeline"><Input {...form.register("decision_timeline")} /></Field>
      </CollapsibleSection>

      <CollapsibleSection title="Sales Evaluation" description="Qualification rating and lead temperature.">
        <Field label="Success Rating" error={form.formState.errors.success_rating?.message}><Input type="number" min={1} max={10} {...form.register("success_rating")} onChange={handleRatingChange} /></Field>
        <SelectField label="Lead Temperature" {...form.register("lead_temperature")} onChange={(event) => { setTemperatureTouched(true); form.setValue("lead_temperature", event.target.value as InteractionFormValues["lead_temperature"]); }}>
          <option value="">Auto from rating</option>
          <option value="cold">Cold</option>
          <option value="warm">Warm</option>
          <option value="hot">Hot</option>
          <option value="very_hot">Very Hot</option>
        </SelectField>
      </CollapsibleSection>

      <CollapsibleSection title="Next Action" description="Future action planning without creating full follow-up tasks yet.">
        <Field label="Next Action"><Input {...form.register("next_action")} /></Field>
        <Field label="Next Follow-up Date & Time"><Input type="datetime-local" {...form.register("next_followup_at")} /></Field>
      </CollapsibleSection>

      <CollapsibleSection title="Internal Notes" description="Internal team context and help flags.">
        <label className="flex items-center gap-2 text-sm font-medium"><input type="checkbox" className="size-4" {...form.register("need_help")} />Need help</label>
        <div className="md:col-span-2 xl:col-span-4"><Label>Internal Note</Label><textarea {...form.register("internal_note")} className="mt-2 min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm" /></div>
      </CollapsibleSection>

      {serverError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p> : null}
      {successMessage ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p> : null}
      <FormActionBar>
        <Button asChild variant="outline"><Link href={interaction ? `/meetings/${interaction.id}` : "/meetings"}>Cancel</Link></Button>
        <Button type="submit" disabled={isPending}><Save />Save</Button>
        {!interaction ? <Button type="button" variant="secondary" disabled={isPending} onClick={form.handleSubmit((values) => onSubmit(values, "addAnother"))}>Save & Add Another</Button> : null}
      </FormActionBar>
    </form>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <Card><CardHeader><CardTitle>{title}</CardTitle><CardDescription>{description}</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</CardContent></Card>;
}
function CollapsibleSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return <details className="rounded-xl border bg-card shadow-soft"><summary className="cursor-pointer list-none p-5"><div className="flex items-start justify-between gap-4"><div><h3 className="font-semibold">{title}</h3><p className="mt-1 text-sm text-muted-foreground">{description}</p></div><span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">Optional</span></div></summary><div className="grid gap-4 p-5 pt-0 md:grid-cols-2 xl:grid-cols-4">{children}</div></details>;
}
function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>{children}{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}
function SelectField({ label, required, error, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean; error?: string }) {
  return <div className="space-y-2"><Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label><select {...props} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm">{children}</select>{error ? <p className="text-xs text-destructive">{error}</p> : null}</div>;
}

function getLocalDateTimeValue() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  return new Date(now.getTime() - offset * 60_000).toISOString().slice(0, 16);
}
