import Link from "next/link";
import { ArrowRight, LucideIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type CrmSettingsCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  href?: string;
  ctaLabel?: string;
  badge?: string;
  meta?: string;
  disabled?: boolean;
};

export function CrmSettingsCard({
  title,
  description,
  href,
  icon: Icon,
  ctaLabel = "Manage",
  badge,
  meta,
  disabled = false,
}: CrmSettingsCardProps) {
  return (
    <Card
      className={cn(
        "group h-full border-slate-200 bg-white shadow-soft hover:-translate-y-0.5 hover:border-slate-300 hover:shadow-md",
        disabled && "hover:translate-y-0 hover:shadow-soft",
      )}
    >
      <CardContent className="flex h-full flex-col gap-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary shadow-sm">
            <Icon className="size-5" />
          </div>
          {badge ? (
            <Badge variant={disabled ? "outline" : "secondary"} className="shrink-0">
              {badge}
            </Badge>
          ) : null}
        </div>
        <div className="space-y-3">
          <div className="space-y-2">
            <h2 className="text-base font-semibold text-slate-900">{title}</h2>
            <p className="text-sm leading-6 text-slate-600">{description}</p>
          </div>
          {meta ? <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{meta}</p> : null}
        </div>
        <div className="mt-auto flex items-center justify-between gap-3 border-t border-slate-100 pt-4">
          <p className="text-xs text-slate-500">{disabled ? "Not available yet" : "Open settings"}</p>
          {disabled || !href ? (
            <Button type="button" variant="outline" disabled>
              {ctaLabel}
            </Button>
          ) : (
            <Button asChild variant="outline" className="group/button">
              <Link href={href}>
                {ctaLabel}
                <ArrowRight className="transition-transform duration-200 group-hover/button:translate-x-0.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
