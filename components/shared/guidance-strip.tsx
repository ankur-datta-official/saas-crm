import { Lightbulb } from "lucide-react";

export function GuidanceStrip({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 px-4 py-3 text-sm text-slate-600 shadow-soft">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-xl bg-white text-primary shadow-sm">
          <Lightbulb className="size-4" />
        </div>
        <div className="leading-6">{children}</div>
      </div>
    </div>
  );
}
