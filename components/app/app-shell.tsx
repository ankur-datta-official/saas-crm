"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";
import type { NotificationRow } from "@/lib/notifications/notifications";
import type { Profile } from "@/lib/auth/session";

type AppShellProps = {
  children: React.ReactNode;
  profile: Profile | null;
  notifications: NotificationRow[];
  unreadNotificationCount: number;
};

export function AppShell({ children, profile, notifications, unreadNotificationCount }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:flex md:h-screen md:overflow-hidden">
      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="flex min-w-0 flex-1 flex-col md:h-screen md:min-h-0">
        <AppTopbar
          onMenuClick={() => setSidebarOpen(true)}
          profile={profile}
          notifications={notifications}
          unreadNotificationCount={unreadNotificationCount}
        />
        <main className="mx-auto w-full max-w-[1500px] min-w-0 flex-1 overflow-x-hidden overflow-y-auto px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
