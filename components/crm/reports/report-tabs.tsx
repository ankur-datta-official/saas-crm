"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ReactNode } from "react";

interface ReportTabsProps {
  currentTab: string;
  lockedTabs?: string[];
  children: ReactNode;
}

export function ReportTabs({ currentTab, lockedTabs = [], children }: ReportTabsProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleTabChange = (value: string) => {
    if (lockedTabs.includes(value)) {
      return;
    }

    const params = new URLSearchParams(searchParams);
    params.set("tab", value);
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <Tabs value={currentTab} onValueChange={handleTabChange} className="w-full">
      <div className="flex items-center justify-between overflow-x-auto pb-2 scrollbar-hide print:hidden">
        <TabsList className="h-10">
          <TabsTrigger value="sales-overview">Sales Overview</TabsTrigger>
          <TabsTrigger value="leads">Leads</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="meetings">Meetings</TabsTrigger>
          <TabsTrigger value="follow-ups">Follow-ups</TabsTrigger>
          <TabsTrigger value="documents" disabled={lockedTabs.includes("documents")}>Documents</TabsTrigger>
          <TabsTrigger value="help-requests" disabled={lockedTabs.includes("help-requests")}>Help Requests</TabsTrigger>
          <TabsTrigger value="team" disabled={lockedTabs.includes("team")}>Team Performance</TabsTrigger>
        </TabsList>
      </div>
      <div className="mt-6">
        {children}
      </div>
    </Tabs>
  );
}
