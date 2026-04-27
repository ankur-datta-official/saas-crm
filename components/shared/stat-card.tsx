import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import Link from "next/link";

type StatCardProps = {
  title: string;
  value: string;
  description?: string;
  icon: LucideIcon;
  tone?: "teal" | "amber" | "rose" | "blue" | "slate";
  href?: string;
};

const toneClasses = {
  teal: "bg-teal-50 text-teal-700",
  amber: "bg-amber-50 text-amber-700",
  rose: "bg-rose-50 text-rose-700",
  blue: "bg-sky-50 text-sky-700",
  slate: "bg-slate-100 text-slate-700",
};

export function StatCard({ title, value, description, icon: Icon, tone = "teal", href }: StatCardProps) {
  const content = (
    <Card className={cn(href && "hover:border-primary/50 transition-colors")}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="mt-3 text-3xl font-semibold tracking-normal">{value}</p>
            {description ? <p className="mt-2 text-xs text-muted-foreground">{description}</p> : null}
          </div>
          <div className={cn("flex size-10 shrink-0 items-center justify-center rounded-md", toneClasses[tone])}>
            <Icon className="size-5" />
          </div>
        </div>
      </CardContent>
    </Card>
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
