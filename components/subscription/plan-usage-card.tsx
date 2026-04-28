import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UsageProgressBar } from "./usage-progress-bar";

type PlanUsageCardProps = {
  title: string;
  description: string;
  used: number;
  limit: number | null;
  unit?: string;
};

export function PlanUsageCard({ title, description, used, limit, unit = "" }: PlanUsageCardProps) {
  const suffix = unit ? ` ${unit}` : "";

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div className="text-2xl font-semibold">
            {used.toLocaleString()}
            <span className="text-sm font-normal text-muted-foreground">{suffix}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {limit === null ? `Unlimited${suffix}` : `${limit.toLocaleString()}${suffix}`}
          </div>
        </div>
        <UsageProgressBar value={used} max={limit} />
      </CardContent>
    </Card>
  );
}
