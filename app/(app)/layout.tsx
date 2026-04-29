import { AppShell } from "@/components/app/app-shell";
import { getCurrentOrganization, getCurrentProfile, requireAuth } from "@/lib/auth/session";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/notifications";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const [profile, organization, notifications, unreadNotificationCount] = await Promise.all([
    getCurrentProfile(),
    getCurrentOrganization(),
    getNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AppShell
      profile={profile}
      organizationName={organization?.name ?? "Sales Workspace"}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </AppShell>
  );
}
