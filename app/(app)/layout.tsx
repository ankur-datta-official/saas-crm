import { AppShell } from "@/components/app/app-shell";
import { getCurrentProfile, requireAuth } from "@/lib/auth/session";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/notifications";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const [profile, notifications, unreadNotificationCount] = await Promise.all([
    getCurrentProfile(),
    getNotifications(),
    getUnreadNotificationCount(),
  ]);

  return (
    <AppShell profile={profile} notifications={notifications} unreadNotificationCount={unreadNotificationCount}>
      {children}
    </AppShell>
  );
}
