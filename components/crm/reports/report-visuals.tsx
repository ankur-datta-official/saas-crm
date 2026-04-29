"use client";

import type { ReactNode } from "react";
import type { TooltipProps } from "recharts";
import type { NameType, ValueType } from "recharts/types/component/DefaultTooltipContent";
import { BarChart3, ChevronRight, Inbox } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export const REPORT_CHART_COLORS = [
  "#0f766e",
  "#0284c7",
  "#f59e0b",
  "#e11d48",
  "#64748b",
  "#14b8a6",
  "#f97316",
];

type ReportSectionIntroProps = {
  text: string;
};

export function ReportSectionIntro({ text }: ReportSectionIntroProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-600 shadow-soft">
      {text}
    </div>
  );
}

type ReportMetricCardProps = {
  title: string;
  value: string;
  detail?: string;
  tone?: "teal" | "sky" | "amber" | "rose" | "slate";
  align?: "left" | "center";
};

const toneClasses = {
  teal: "bg-teal-50 text-teal-700",
  sky: "bg-sky-50 text-sky-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  slate: "bg-slate-100 text-slate-700",
};

export function ReportMetricCard({
  title,
  value,
  detail,
  tone = "slate",
  align = "left",
}: ReportMetricCardProps) {
  return (
    <Card className="border-slate-200 bg-white shadow-soft">
      <CardContent className={cn("p-4", align === "center" && "text-center")}>
        <div className={cn("flex items-start justify-between gap-3", align === "center" && "justify-center")}>
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">{title}</p>
            <p className="mt-2 text-2xl font-semibold tracking-normal text-slate-900">{value}</p>
            {detail ? <p className="mt-2 text-sm leading-5 text-slate-500">{detail}</p> : null}
          </div>
          {align === "left" ? (
            <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", toneClasses[tone])}>
              <ChevronRight className="size-4" />
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

type ReportChartEmptyStateProps = {
  title?: string;
  description?: string;
  className?: string;
};

export function ReportChartEmptyState({
  title = "No report data yet",
  description = "Add companies, meetings, and follow-ups to generate analytics.",
  className,
}: ReportChartEmptyStateProps) {
  return (
    <div className={cn("flex h-full items-center justify-center", className)}>
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
          <Inbox className="size-5" />
        </div>
        <p className="mt-4 text-sm font-medium text-slate-900">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{description}</p>
      </div>
    </div>
  );
}

export function ReportChartTooltip({ active, payload, label }: TooltipProps<ValueType, NameType>) {
  if (!active || !payload?.length) {
    return null;
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-3 py-2 shadow-lg">
      {label !== undefined && label !== null ? (
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">{String(label)}</p>
      ) : null}
      <div className="space-y-1.5">
        {payload.map((item, index) => (
          <div key={`${item.dataKey}-${index}`} className="flex items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-2 text-slate-600">
              <span
                className="size-2.5 rounded-full"
                style={{ backgroundColor: item.color ?? "#0f766e" }}
              />
              <span>{String(item.name ?? item.dataKey ?? "Value")}</span>
            </div>
            <span className="font-medium text-slate-900">{String(item.value ?? "-")}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

type LegendPayloadItem = {
  color?: string;
  value?: string;
};

export function ReportChartLegend({ payload }: { payload?: LegendPayloadItem[] }) {
  if (!payload?.length) {
    return null;
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-2">
      {payload.map((entry, index) => (
        <div key={`${entry.value}-${index}`} className="flex items-center gap-2 text-xs text-slate-500">
          <span className="size-2.5 rounded-full" style={{ backgroundColor: entry.color ?? "#0f766e" }} />
          <span>{entry.value}</span>
        </div>
      ))}
    </div>
  );
}

export function ReportLoadingFallback() {
  return (
    <div className="flex h-[360px] items-center justify-center rounded-2xl border border-slate-200 bg-white text-sm text-slate-500 shadow-soft">
      <div className="flex items-center gap-3">
        <BarChart3 className="size-4 text-primary" />
        <span>Loading report...</span>
      </div>
    </div>
  );
}
