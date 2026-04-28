"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  markAllNotificationsAsRead,
  markNotificationAsRead,
  type NotificationRow,
} from "@/lib/notifications/notifications";
import { cn } from "@/lib/utils";

type NotificationCenterProps = {
  initialNotifications: NotificationRow[];
  initialUnreadCount: number;
};

export function NotificationCenter({
  initialNotifications,
  initialUnreadCount,
}: NotificationCenterProps) {
  const router = useRouter();
  const [notifications, setNotifications] = useState(initialNotifications);
  const [unreadCount, setUnreadCount] = useState(initialUnreadCount);
  const [isPending, startTransition] = useTransition();

  const hasNotifications = notifications.length > 0;
  const unreadLabel = useMemo(() => (unreadCount > 9 ? "9+" : String(unreadCount)), [unreadCount]);

  function updateAsRead(notificationId: string) {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              is_read: true,
              read_at: new Date().toISOString(),
            }
          : notification,
      ),
    );
    setUnreadCount((current) => Math.max(0, current - 1));
  }

  function handleNotificationClick(notification: NotificationRow) {
    if (!notification.is_read) {
      updateAsRead(notification.id);
      startTransition(async () => {
        await markNotificationAsRead(notification.id);
        router.refresh();
      });
    }
  }

  function handleMarkAllAsRead() {
    if (unreadCount === 0) {
      return;
    }

    setNotifications((current) =>
      current.map((notification) => ({
        ...notification,
        is_read: true,
        read_at: notification.read_at ?? new Date().toISOString(),
      })),
    );
    setUnreadCount(0);
    startTransition(async () => {
      await markAllNotificationsAsRead();
      router.refresh();
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="Open notifications">
          <Bell />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
              {unreadLabel}
            </span>
          ) : null}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={10} className="w-[min(22rem,calc(100vw-1rem))] p-0">
        <div className="flex items-center justify-between px-3 py-3">
          <DropdownMenuLabel className="p-0">Notifications</DropdownMenuLabel>
          <Button type="button" variant="ghost" size="sm" className="h-auto px-2 text-xs" disabled={isPending || unreadCount === 0} onClick={handleMarkAllAsRead}>
            Mark all as read
          </Button>
        </div>
        <DropdownMenuSeparator />
        {!hasNotifications ? (
          <div className="px-3 py-6 text-sm text-muted-foreground">No notifications yet.</div>
        ) : (
          <div className="max-h-[26rem] overflow-y-auto p-2">
            {notifications.map((notification) => (
              <DropdownMenuItem key={notification.id} asChild className={cn("block cursor-pointer rounded-xl px-3 py-3", !notification.is_read && "bg-primary/5")}>
                <Link href={notification.link ?? "#"} onClick={() => handleNotificationClick(notification)}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{notification.message}</p>
                    </div>
                    {!notification.is_read ? (
                      <span className="mt-1 size-2 shrink-0 rounded-full bg-primary" />
                    ) : null}
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {new Date(notification.created_at).toLocaleString()}
                  </p>
                </Link>
              </DropdownMenuItem>
            ))}
          </div>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
