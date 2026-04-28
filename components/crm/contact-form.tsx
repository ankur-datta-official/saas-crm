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
import {
  contactPersonSchema,
  decisionRoleOptions,
  preferredContactMethodOptions,
  relationshipLevelOptions,
  type ContactPersonFormValues,
} from "@/lib/crm/schemas";
import { createContactAction, updateContactAction } from "@/lib/crm/actions";
import type { Company, ContactPerson } from "@/lib/crm/types";

type ContactFormProps = {
  contact?: ContactPerson;
  companies: Company[];
  defaultCompanyId?: string;
};

export function ContactForm({ contact, companies, defaultCompanyId }: ContactFormProps) {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const form = useForm<ContactPersonFormValues>({
    resolver: zodResolver(contactPersonSchema),
    defaultValues: {
      name: contact?.name ?? "",
      company_id: contact?.company_id ?? defaultCompanyId ?? "",
      designation: contact?.designation ?? "",
      department: contact?.department ?? "",
      mobile: contact?.mobile ?? "",
      whatsapp: contact?.whatsapp ?? "",
      email: contact?.email ?? "",
      linkedin: contact?.linkedin ?? "",
      decision_role: contact?.decision_role ?? "",
      relationship_level: contact?.relationship_level ?? "",
      preferred_contact_method: contact?.preferred_contact_method ?? "Phone",
      remarks: contact?.remarks ?? "",
      is_primary: contact?.is_primary ?? false,
      status: contact?.status ?? "active",
    },
  });

  function onSubmit(values: ContactPersonFormValues, mode: "save" | "addAnother" = "save") {
    setServerError(null);
    setSuccessMessage(null);
    startTransition(async () => {
      const result = contact ? await updateContactAction(contact.id, values) : await createContactAction(values);

      if (!result.ok) {
        setServerError(result.error ?? "Unable to save contact.");
        return;
      }

      if (mode === "addAnother" && !contact) {
        form.reset({
          name: "",
          company_id: values.company_id,
          designation: "",
          department: "",
          mobile: "",
          whatsapp: "",
          email: "",
          linkedin: "",
          decision_role: "",
          relationship_level: "",
          preferred_contact_method: "Phone",
          remarks: "",
          is_primary: false,
          status: "active",
        });
        setSuccessMessage("Contact saved. You can add another contact now.");
        return;
      }

      router.push(`/contacts/${result.id}`);
      router.refresh();
    });
  }

  return (
    <form className="space-y-5" onSubmit={form.handleSubmit((values) => onSubmit(values, "save"))}>
      <FormRequiredNote message="Add the contact name and linked company first. You can fill in communication preferences, relationship details, and remarks later." />
      {defaultCompanyId && !contact ? (
        <FormContextHint message="This contact is being added from a company context, so the company is preselected for faster entry." />
      ) : null}
      <FormSection title="Basic Information" description="Contact identity and company placement.">
        <Field label="Name" required error={form.formState.errors.name?.message}><Input {...form.register("name")} /></Field>
        <SelectField label="Company" required error={form.formState.errors.company_id?.message} {...form.register("company_id")}>
          <option value="">Select company</option>
          {companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}
        </SelectField>
        <Field label="Designation"><Input {...form.register("designation")} /></Field>
        <Field label="Department"><Input {...form.register("department")} /></Field>
      </FormSection>

      <CollapsibleSection title="Contact Information" description="Communication channels for this person.">
        <Field label="Mobile"><Input {...form.register("mobile")} /></Field>
        <Field label="WhatsApp"><Input {...form.register("whatsapp")} /></Field>
        <Field label="Email" error={form.formState.errors.email?.message}><Input {...form.register("email")} /></Field>
        <Field label="LinkedIn" error={form.formState.errors.linkedin?.message}><Input {...form.register("linkedin")} placeholder="https://linkedin.com/in/name" /></Field>
      </CollapsibleSection>

      <CollapsibleSection title="Relationship Information" description="Decision role, relationship strength, and preferred outreach.">
        <SelectField label="Decision role" {...form.register("decision_role")}>
          <option value="">Select role</option>
          {decisionRoleOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SelectField>
        <SelectField label="Relationship level" {...form.register("relationship_level")}>
          <option value="">Select level</option>
          {relationshipLevelOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SelectField>
        <SelectField label="Preferred method" {...form.register("preferred_contact_method")}>
          <option value="">Select method</option>
          {preferredContactMethodOptions.map((option) => <option key={option} value={option}>{option}</option>)}
        </SelectField>
        <SelectField label="Status" {...form.register("status")}>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </SelectField>
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" className="size-4" {...form.register("is_primary")} />
          Primary contact
        </label>
        <div className="md:col-span-2 xl:col-span-4">
          <Label htmlFor="remarks">Remarks</Label>
          <textarea id="remarks" {...form.register("remarks")} className="mt-2 min-h-28 w-full rounded-xl border border-input bg-background px-3 py-2 text-sm shadow-sm" />
        </div>
      </CollapsibleSection>

      {serverError ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{serverError}</p> : null}
      {successMessage ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{successMessage}</p> : null}
      <FormActionBar>
        <Button asChild variant="outline">
          <Link href={contact ? `/contacts/${contact.id}` : "/contacts"}>Cancel</Link>
        </Button>
        <Button type="submit" disabled={isPending || form.formState.isSubmitting}>
          <Save />
          {contact ? "Update contact" : "Save"}
        </Button>
        {!contact ? (
          <Button
            type="button"
            variant="secondary"
            disabled={isPending || form.formState.isSubmitting}
            onClick={form.handleSubmit((values) => onSubmit(values, "addAnother"))}
          >
            Save & Add Another
          </Button>
        ) : null}
      </FormActionBar>
    </form>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{children}</CardContent>
    </Card>
  );
}

function CollapsibleSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  return (
    <details className="rounded-xl border bg-card text-card-foreground shadow-soft">
      <summary className="cursor-pointer list-none p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold">{title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-600">
            Optional
          </span>
        </div>
      </summary>
      <div className="grid gap-4 p-5 pt-0 md:grid-cols-2 xl:grid-cols-4">{children}</div>
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
  required,
  error,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & { label: string; required?: boolean; error?: string }) {
  return (
    <div className="space-y-2">
      <Label>{label}{required ? <span className="text-destructive"> *</span> : null}</Label>
      <select {...props} className="h-11 w-full rounded-xl border border-input bg-background px-3 text-sm shadow-sm">
        {children}
      </select>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
