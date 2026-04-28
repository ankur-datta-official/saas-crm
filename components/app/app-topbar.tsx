"use client";

import { Menu } from "lucide-react";
import { LogoutButton } from "@/components/auth/logout-button";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { GlobalSearchInput } from "@/components/search/global-search-input";
import { Button } from "@/components/ui/button";
import type { Profile } from "@/lib/auth/session";
import type { NotificationRow } from "@/lib/notifications/notifications";
import { getDisplayName, getInitials } from "@/lib/utils";

type AppTopbarProps = {
  onMenuClick?: () => void;
  profile: Profile | null;
  notifications: NotificationRow[];
  unreadNotificationCount: number;
};

export function AppTopbar({ onMenuClick, profile, notifications, unreadNotificationCount }: AppTopbarProps) {
  const displayName = getDisplayName(profile?.full_name, profile?.email, "Workspace user");
  const initials = getInitials(profile?.full_name, profile?.email);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200 bg-background/95 px-4 backdrop-blur md:px-6">
      <Button className="md:hidden" variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open navigation">
        <Menu />
        <span className="sr-only">Open navigation</span>
      </Button>
      <GlobalSearchInput />
      <div className="ml-auto flex items-center gap-2">
        <NotificationCenter initialNotifications={notifications} initialUnreadCount={unreadNotificationCount} />
        <LogoutButton />
        <div className="flex min-w-0 items-center gap-3 rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-sm transition-all duration-200 hover:border-slate-300">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary text-sm font-semibold text-primary-foreground shadow-sm">
            {initials}
          </div>
          <div className="hidden min-w-0 md:block">
            <p className="truncate text-sm font-medium text-slate-900">{displayName}</p>
            <p className="truncate text-xs text-slate-500">{profile?.email ?? "Signed in"}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
