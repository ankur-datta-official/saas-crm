import { cn } from "@/lib/utils";

type UsageProgressBarProps = {
  value: number;
  max: number | null;
  className?: string;
};

export function UsageProgressBar({ value, max, className }: UsageProgressBarProps) {
  const percentage = max === null || max <= 0 ? 0 : Math.min(100, Math.round((value / max) * 100));

  return (
    <div className={cn("h-2 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          percentage >= 90 ? "bg-rose-500" : percentage >= 75 ? "bg-amber-500" : "bg-teal-600",
        )}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
