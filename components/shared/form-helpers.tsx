"use client";

import type React from "react";
import { Info, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

export function FormRequiredNote({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600 shadow-soft">
      <div className="flex items-start gap-3">
        <Info className="mt-0.5 h-4 w-4 shrink-0 text-teal-700" />
        <div className="space-y-1">
          <p className="font-medium text-slate-900">Required fields are marked with <span className="text-rose-600">*</span>.</p>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
}

export function FormContextHint({
  message,
}: {
  message: string;
}) {
  return (
    <div className="rounded-2xl border border-teal-200 bg-teal-50/80 px-4 py-3 text-sm text-teal-900">
      <div className="flex items-start gap-3">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0" />
        <p>{message}</p>
      </div>
    </div>
  );
}

export function FormActionBar({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "sticky bottom-4 z-10 rounded-2xl border border-slate-200 bg-white/95 p-3 shadow-soft backdrop-blur supports-[backdrop-filter]:bg-white/90",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-end gap-2">{children}</div>
    </div>
  );
}
