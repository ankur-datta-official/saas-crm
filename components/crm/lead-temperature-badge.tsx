import { Badge } from "@/components/ui/badge";
import type { LeadTemperature } from "@/lib/crm/types";

export function LeadTemperatureBadge({ temperature }: { temperature: LeadTemperature }) {
  const variant = temperature === "hot" ? "destructive" : temperature === "warm" ? "warning" : "secondary";
  return <Badge variant={variant}>{temperature}</Badge>;
}
