"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/app/app-sidebar";
import { AppTopbar } from "@/components/app/app-topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background md:flex">
      <AppSidebar open={sidebarOpen} onOpenChange={setSidebarOpen} />
      <div className="min-w-0 flex-1">
        <AppTopbar onMenuClick={() => setSidebarOpen(true)} />
        <main className="mx-auto w-full max-w-[1500px] px-4 py-6 md:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
