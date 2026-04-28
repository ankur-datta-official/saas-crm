"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, X } from "lucide-react";
import { sidebarItems } from "@/config/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppSidebarProps = {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export function AppSidebar({ open = false, onOpenChange }: AppSidebarProps) {
  const pathname = usePathname();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/35 md:hidden",
          open ? "block" : "hidden",
        )}
        onClick={() => onOpenChange?.(false)}
      />
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-72 flex-col overflow-hidden border-r border-slate-200 bg-white/95 backdrop-blur transition-transform md:sticky md:top-0 md:z-auto md:h-screen md:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <Link href="/dashboard" className="flex min-w-0 items-center gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm">
              <Building2 className="size-5" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold text-slate-900">Client CRM</span>
              <span className="block truncate text-xs text-slate-500">Sales Workspace</span>
            </span>
          </Link>
          <Button className="md:hidden" variant="ghost" size="icon" onClick={() => onOpenChange?.(false)} aria-label="Close navigation">
            <X />
            <span className="sr-only">Close navigation</span>
          </Button>
        </div>
        <nav className="min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-4">
          {sidebarItems.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onOpenChange?.(false)}
                className={cn(
                  "flex h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium text-slate-600 transition-all duration-200 hover:bg-slate-100 hover:text-slate-900",
                  active && "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/10",
                )}
              >
                <Icon className="size-4 shrink-0" />
                <span className="truncate">{item.title}</span>
              </Link>
            );
          })}
        </nav>
        <div className="shrink-0 border-t border-slate-200 p-4">
          <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-3 transition-all duration-200 hover:border-slate-300 hover:bg-slate-50">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">Workspace</p>
            <p className="mt-1 truncate text-sm font-medium text-slate-900">Acme Enterprise</p>
          </div>
        </div>
      </aside>
    </>
  );
}
