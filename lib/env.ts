import { z } from "zod";

const clientEnvSchema = z.object({
  supabaseUrl: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid Supabase project URL."),
  supabasePublishableKey: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY is required."),
  appUrl: z.string().url("NEXT_PUBLIC_APP_URL must be a valid URL."),
});

export const env = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabasePublishableKey:
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  appUrl: process.env.NEXT_PUBLIC_APP_URL ?? "",
};

export function hasSupabaseEnv() {
  return Boolean(env.supabaseUrl && env.supabasePublishableKey);
}

export function getSupabaseEnv() {
  const parsed = clientEnvSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(parsed.error.errors.map((error) => error.message).join(" "));
  }

  return parsed.data;
}
