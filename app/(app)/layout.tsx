import { AppShell } from "@/components/app/app-shell";
import { requireAuth } from "@/lib/auth/session";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();

  return <AppShell>{children}</AppShell>;
}
