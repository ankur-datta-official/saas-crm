"use client";

import Link from "next/link";
import { ChevronDown, Menu, Settings, User, Wallet2, LogOut, Bell } from "lucide-react";
import { NotificationCenter } from "@/components/notifications/notification-center";
import { UserAvatar } from "@/components/shared/user-avatar";
import { GlobalSearchInput } from "@/components/search/global-search-input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { Profile } from "@/lib/auth/session";
import type { NotificationRow } from "@/lib/notifications/notifications";
import type { WalletSummary } from "@/lib/scoring/types";
import { getDisplayName } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

export type AppTopbarProps = {
  onMenuClick?: () => void;
  profile: Profile | null;
  notifications: NotificationRow[];
  unreadNotificationCount: number;
  walletSummary: WalletSummary | null;
};

export function AppTopbar({ 
  onMenuClick, 
  profile, 
  notifications, 
  unreadNotificationCount,
  walletSummary
}: AppTopbarProps) {
  const router = useRouter();
  const displayName = getDisplayName(profile?.full_name, profile?.email, "Workspace user");

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-slate-200/60 bg-white/80 px-4 backdrop-blur-md md:px-6">
      <Button className="md:hidden" variant="ghost" size="icon" onClick={onMenuClick} aria-label="Open navigation">
        <Menu />
        <span className="sr-only">Open navigation</span>
      </Button>
      
      <div className="flex-1 max-w-md hidden sm:block">
        <GlobalSearchInput />
      </div>

      <div className="ml-auto flex items-center gap-4">
        {/* Notification Center */}
        <NotificationCenter initialNotifications={notifications} initialUnreadCount={unreadNotificationCount} />
        
        {/* Premium Score Wallet */}
        <motion.div
          whileHover={{ y: -1 }}
          whileTap={{ scale: 0.98 }}
        >
          <Link
            href="/rewards"
            className="group flex items-center gap-2.5 rounded-2xl border border-amber-200/50 bg-gradient-to-br from-amber-50 to-orange-50/50 px-3.5 py-1.5 shadow-sm transition-all hover:border-amber-300 hover:shadow-md"
          >
            <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-tr from-amber-500 to-orange-400 text-white shadow-inner ring-2 ring-white/50 group-hover:animate-pulse">
              <Wallet2 className="size-4.5" />
            </div>
            <div className="flex flex-col">
              <span className="text-[9px] font-bold uppercase tracking-[0.05em] text-amber-600/80 leading-none">Wallet</span>
              <span className="text-[15px] font-black text-amber-700 leading-tight tracking-tight">
                {walletSummary?.wallet_balance?.toLocaleString() ?? 0}
              </span>
            </div>
          </Link>
        </motion.div>

        {/* Premium Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="group flex min-w-0 items-center gap-3 rounded-[20px] border border-slate-200/80 bg-white p-1.5 pr-4 shadow-sm transition-all duration-300 hover:border-primary/30 hover:bg-slate-50/50 hover:shadow-md outline-none active:scale-[0.98]">
              <div className="relative">
                <UserAvatar
                  imageUrl={profile?.avatar_url}
                  fullName={profile?.full_name}
                  email={profile?.email}
                  className="size-9 rounded-[14px] shadow-sm ring-2 ring-white transition-transform group-hover:scale-105"
                />
                <div className="absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-2 border-white bg-emerald-500 shadow-sm" />
              </div>
              <div className="hidden min-w-0 flex-col items-start md:flex">
                <span className="truncate text-[13px] font-bold text-slate-800 leading-none group-hover:text-primary transition-colors">{displayName}</span>
                <span className="truncate text-[10px] font-semibold text-slate-400 mt-1 uppercase tracking-wider">Administrator</span>
              </div>
              <ChevronDown className="size-4 text-slate-300 group-hover:text-slate-500 transition-colors ml-1" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={12} className="w-64 p-2 rounded-[24px] shadow-2xl border-slate-200/60 bg-white/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200">
            <DropdownMenuLabel className="px-3 py-4">
              <div className="flex items-center gap-3">
                <UserAvatar
                  imageUrl={profile?.avatar_url}
                  fullName={profile?.full_name}
                  email={profile?.email}
                  className="size-10 rounded-xl shadow-sm"
                />
                <div className="flex flex-col min-w-0">
                  <p className="text-[14px] font-black text-slate-900 truncate">{displayName}</p>
                  <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">{profile?.email}</p>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator className="mx-2 bg-slate-100/80" />
            <div className="p-1.5 space-y-1">
              <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors group">
                <Link href="/settings/profile" className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 group-focus:bg-primary/10 transition-colors text-slate-500 group-focus:text-primary">
                    <User className="size-4" />
                  </div>
                  <span className="text-[13px] font-bold">Profile Settings</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="rounded-xl focus:bg-primary/5 focus:text-primary cursor-pointer transition-colors group">
                <Link href="/settings" className="flex items-center gap-3 px-3 py-2.5">
                  <div className="flex size-8 items-center justify-center rounded-lg bg-slate-50 group-focus:bg-primary/10 transition-colors text-slate-500 group-focus:text-primary">
                    <Settings className="size-4" />
                  </div>
                  <span className="text-[13px] font-bold">Organization</span>
                </Link>
              </DropdownMenuItem>
            </div>
            <DropdownMenuSeparator className="mx-2 bg-slate-100/80" />
            <div className="p-1.5">
              <DropdownMenuItem 
                onClick={handleLogout}
                className="rounded-xl focus:bg-rose-50 text-rose-600 focus:text-rose-700 cursor-pointer flex items-center gap-3 px-3 py-2.5 group transition-colors"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-rose-50/50 group-focus:bg-rose-100 transition-colors">
                  <LogOut className="size-4" />
                </div>
                <span className="text-[13px] font-bold">Sign Out</span>
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
