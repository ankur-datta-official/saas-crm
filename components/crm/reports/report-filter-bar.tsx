"use client";

import { useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Calendar, User, Building2, Layers, Thermometer, Tag, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { 
  TeamMemberOption, 
  Industry, 
  PipelineStage, 
  CompanyCategory 
} from "@/lib/crm/types";

interface ReportFilterBarProps {
  users: TeamMemberOption[];
  industries: Industry[];
  stages: PipelineStage[];
  categories: CompanyCategory[];
}

export function ReportFilterBar({ users, industries, stages, categories }: ReportFilterBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [dateRange, setDateRange] = useState(searchParams.get("dateRange") || "this_month");
  const [assignedUserId, setAssignedUserId] = useState(searchParams.get("assignedUserId") || "all");
  const [industryId, setIndustryId] = useState(searchParams.get("industryId") || "all");
  const [pipelineStageId, setPipelineStageId] = useState(searchParams.get("pipelineStageId") || "all");
  const [leadTemperature, setLeadTemperature] = useState(searchParams.get("leadTemperature") || "all");
  const [companyCategoryId, setCompanyCategoryId] = useState(searchParams.get("companyCategoryId") || "all");

  const applyFilters = () => {
    const params = new URLSearchParams(searchParams);
    
    if (dateRange && dateRange !== "all") params.set("dateRange", dateRange);
    else params.delete("dateRange");

    if (assignedUserId && assignedUserId !== "all") params.set("assignedUserId", assignedUserId);
    else params.delete("assignedUserId");

    if (industryId && industryId !== "all") params.set("industryId", industryId);
    else params.delete("industryId");

    if (pipelineStageId && pipelineStageId !== "all") params.set("pipelineStageId", pipelineStageId);
    else params.delete("pipelineStageId");

    if (leadTemperature && leadTemperature !== "all") params.set("leadTemperature", leadTemperature);
    else params.delete("leadTemperature");

    if (companyCategoryId && companyCategoryId !== "all") params.set("companyCategoryId", companyCategoryId);
    else params.delete("companyCategoryId");

    router.push(`${pathname}?${params.toString()}`);
  };

  const clearFilters = () => {
    setDateRange("this_month");
    setAssignedUserId("all");
    setIndustryId("all");
    setPipelineStageId("all");
    setLeadTemperature("all");
    setCompanyCategoryId("all");
    router.push(pathname);
  };

  return (
    <div className="crm-filter-surface print:hidden">
      <div className="flex flex-wrap items-end gap-3">
      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Calendar className="size-3.5" /> Date Range
        </label>
        <Select value={dateRange} onValueChange={setDateRange}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="Select period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="today">Today</SelectItem>
            <SelectItem value="this_week">This Week</SelectItem>
            <SelectItem value="this_month">This Month</SelectItem>
            <SelectItem value="last_30_days">Last 30 Days</SelectItem>
            <SelectItem value="this_quarter">This Quarter</SelectItem>
            <SelectItem value="custom" disabled>Custom range</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <User className="size-3.5" /> Assigned User
        </label>
        <Select value={assignedUserId} onValueChange={setAssignedUserId}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="All Users" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Users</SelectItem>
            {users.map((user) => (
              <SelectItem key={user.id} value={user.id}>
                {user.full_name || user.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
          <Building2 className="size-3.5" /> Industry
        </label>
        <Select value={industryId} onValueChange={setIndustryId}>
          <SelectTrigger className="w-[160px] h-9 text-xs">
            <SelectValue placeholder="All Industries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Industries</SelectItem>
            {industries.map((industry) => (
              <SelectItem key={industry.id} value={industry.id}>
                {industry.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-2">
        <Button onClick={applyFilters} size="sm" className="h-9 px-4">
          <Search className="mr-2 size-3.5" /> Filter
        </Button>
        <Button onClick={clearFilters} variant="outline" size="sm" className="h-9 px-3">
          <X className="mr-2 size-3.5" /> Reset
        </Button>
      </div>
      </div>

      <details className="mt-4">
        <summary className="cursor-pointer list-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-700">
          More filters
        </summary>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Layers className="size-3.5" /> Pipeline Stage
            </label>
            <Select value={pipelineStageId} onValueChange={setPipelineStageId}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <SelectValue placeholder="All Stages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Stages</SelectItem>
                {stages.map((stage) => (
                  <SelectItem key={stage.id} value={stage.id}>
                    {stage.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Thermometer className="size-3.5" /> Temperature
            </label>
            <Select value={leadTemperature} onValueChange={setLeadTemperature}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="cold">Cold</SelectItem>
                <SelectItem value="warm">Warm</SelectItem>
                <SelectItem value="hot">Hot</SelectItem>
                <SelectItem value="very_hot">Very Hot</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Tag className="size-3.5" /> Category
            </label>
            <Select value={companyCategoryId} onValueChange={setCompanyCategoryId}>
              <SelectTrigger className="w-[140px] h-9 text-xs">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </details>
    </div>
  );
}
