"use client";

import { LucideIcon, TrendingDown, TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { motion } from "framer-motion";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "rose" | "blue" | "slate";
  href?: string;
  className?: string;
  trend?: {
    value: string | number;
    label: string;
    isPositive: boolean;
  };
};

const toneClasses = {
  teal: "bg-teal-50 text-teal-700 ring-teal-100",
  amber: "bg-amber-50 text-amber-700 ring-amber-100",
  rose: "bg-rose-50 text-rose-700 ring-rose-100",
  blue: "bg-sky-50 text-sky-700 ring-sky-100",
  slate: "bg-slate-100 text-slate-700 ring-slate-200",
};

const trendToneClasses = {
  teal: "text-teal-600",
  amber: "text-amber-600",
  rose: "text-rose-600",
  blue: "text-sky-600",
  slate: "text-slate-600",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "teal",
  href,
  className,
  trend,
}: StatCardProps) {
  const content = (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        className={cn(
          "rounded-[24px] border border-slate-200/80 bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] transition-all duration-200",
          href && "hover:border-slate-300 hover:shadow-[0_8px_16px_rgba(0,0,0,0.06)] hover:bg-slate-50/30",
          className,
        )}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="mt-3 text-[1.75rem] font-semibold leading-tight tracking-tight text-slate-900">{value}</p>
              <div className="mt-2 flex flex-col gap-1">
                {description ? (
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                    {description}
                  </p>
                ) : null}
                {trend ? (
                  <div
                    className={cn(
                      "flex items-center gap-1 text-[11px] font-bold",
                      trendToneClasses[tone],
                    )}
                  >
                    {trend.isPositive ? (
                      <TrendingUp className="size-3" />
                    ) : (
                      <TrendingDown className="size-3" />
                    )}
                    <span>
                      {trend.value} {trend.label}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
            <div
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-2xl ring-1 ring-inset",
                toneClasses[tone],
              )}
            >
              <Icon className="size-5" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  if (href) {
    return (
      <Link href={href} className="block no-underline">
        {content}
      </Link>
    );
  }

  return content;
}
