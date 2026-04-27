"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface ReportChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  height?: string | number;
}

export function ReportChartCard({
  title,
  description,
  children,
  className,
  height = 300,
}: ReportChartCardProps) {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        {description && <CardDescription>{description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div style={{ height }} className="w-full">
          {children}
        </div>
      </CardContent>
    </Card>
  );
}
