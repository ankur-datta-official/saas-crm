"use client";

import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight, Building2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/shared/page-header";

const workspaceSchema = z.object({
  name: z.string().min(2, "Workspace name is required."),
  companySize: z.string().min(1, "Company size is required."),
});

type WorkspaceValues = z.infer<typeof workspaceSchema>;

export function WorkspaceForm() {
  const router = useRouter();
  const form = useForm<WorkspaceValues>({
    resolver: zodResolver(workspaceSchema),
    defaultValues: {
      name: "",
      companySize: "",
    },
  });

  function onSubmit() {
    router.push("/dashboard");
  }

  return (
    <div>
      <PageHeader
        title="Create workspace"
        description="Set up the organization container for users, roles, CRM data, meetings, and reporting."
      />
      <Card className="max-w-2xl">
        <CardHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Building2 className="size-5" />
          </div>
          <CardTitle>Organization details</CardTitle>
          <CardDescription>Database persistence and tenant policies will be added in a later sprint.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input id="name" placeholder="Acme Enterprise" {...form.register("name")} />
              {form.formState.errors.name ? (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="companySize">Company size</Label>
              <Input id="companySize" placeholder="51-200" {...form.register("companySize")} />
              {form.formState.errors.companySize ? (
                <p className="text-xs text-destructive">{form.formState.errors.companySize.message}</p>
              ) : null}
            </div>
            <Button type="submit">
              Continue to dashboard
              <ArrowRight />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
