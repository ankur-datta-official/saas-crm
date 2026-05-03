import { AppShell } from "@/components/app/app-shell";
import { getCurrentOrganization, getCurrentProfile, requireAuth } from "@/lib/auth/session";
import { getNotifications, getUnreadNotificationCount } from "@/lib/notifications/notifications";
import { getCurrentUserWalletSummary } from "@/lib/scoring/queries";

export default async function ProtectedAppLayout({ children }: { children: React.ReactNode }) {
  await requireAuth();
  const [profile, organization, notifications, unreadNotificationCount, walletSummary] = await Promise.all([
    getCurrentProfile(),
    getCurrentOrganization(),
    getNotifications(),
    getUnreadNotificationCount(),
    getCurrentUserWalletSummary(),
  ]);

  return (
    <AppShell
      profile={profile}
      organizationName={organization?.name ?? "Sales Workspace"}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
      walletSummary={walletSummary}
    >
      {children}
    </AppShell>
  );
}
