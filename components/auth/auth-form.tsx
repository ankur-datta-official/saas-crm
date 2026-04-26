"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const authSchema = z.object({
  email: z.string().email("Enter a valid work email."),
  password: z.string().min(8, "Use at least 8 characters."),
  fullName: z.string().optional(),
});

type AuthValues = z.infer<typeof authSchema>;

type AuthFormProps = {
  mode: "login" | "register";
};

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRegister = mode === "register";

  const form = useForm<AuthValues>({
    resolver: zodResolver(authSchema),
    defaultValues: {
      email: "",
      password: "",
      fullName: "",
    },
  });

  async function onSubmit(values: AuthValues) {
    setError(null);
    setMessage(null);
    const supabase = createClient();

    if (isRegister) {
      const { error: signUpError } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: {
          data: {
            full_name: values.fullName,
          },
          emailRedirectTo: `${window.location.origin}/onboarding/workspace`,
        },
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setMessage("Check your email to confirm your account, then create your workspace.");
      router.push("/onboarding/workspace");
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: values.email,
      password: values.password,
    });

    if (signInError) {
      setError(signInError.message);
      return;
    }

    router.push(searchParams.get("next") ?? "/dashboard");
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isRegister ? "Create your account" : "Welcome back"}</CardTitle>
        <CardDescription>
          {isRegister ? "Start with your admin account. Workspace setup comes next." : "Sign in to your CRM workspace."}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          {isRegister ? (
            <div className="space-y-2">
              <Label htmlFor="fullName">Full name</Label>
              <Input id="fullName" placeholder="Amina Rahman" {...form.register("fullName")} />
            </div>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="email">Work email</Label>
            <Input id="email" type="email" placeholder="you@company.com" {...form.register("email")} />
            {form.formState.errors.email ? (
              <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
            ) : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="Minimum 8 characters" {...form.register("password")} />
            {form.formState.errors.password ? (
              <p className="text-xs text-destructive">{form.formState.errors.password.message}</p>
            ) : null}
          </div>
          {error ? <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
          {message ? <p className="rounded-md bg-emerald-50 p-3 text-sm text-emerald-700">{message}</p> : null}
          <Button className="w-full" type="submit" disabled={form.formState.isSubmitting}>
            {isRegister ? "Create account" : "Sign in"}
            <ArrowRight />
          </Button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">
          {isRegister ? "Already have an account?" : "New to the CRM?"}{" "}
          <Link className="font-medium text-primary hover:underline" href={isRegister ? "/auth/login" : "/auth/register"}>
            {isRegister ? "Sign in" : "Create account"}
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
