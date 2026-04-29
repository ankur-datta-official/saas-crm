"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";
import { ReportChartEmptyState } from "./report-visuals";

interface ReportChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  height?: string | number;
  isEmpty?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
}

export function ReportChartCard({
  title,
  description,
  children,
  className,
  height = 300,
  isEmpty = false,
  emptyTitle,
  emptyDescription,
}: ReportChartCardProps) {
  return (
    <Card className={cn("overflow-hidden border-slate-200 bg-white shadow-soft", className)}>
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-semibold text-slate-900">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent className="pt-0">
        <div style={{ height }} className="w-full">
          {isEmpty ? (
            <ReportChartEmptyState title={emptyTitle} description={emptyDescription} />
          ) : (
            children
          )}
        </div>
      </CardContent>
    </Card>
  );
}
