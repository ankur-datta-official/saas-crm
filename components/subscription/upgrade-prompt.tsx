import Link from "next/link";
import { ArrowUpRight, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type UpgradePromptProps = {
  title?: string;
  description: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function UpgradePrompt({
  title = "Upgrade Required",
  description,
  ctaHref = "/subscription",
  ctaLabel = "Review Plans",
}: UpgradePromptProps) {
  return (
    <Card className="border-amber-200 bg-amber-50/70">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Lock className="h-5 w-5" />
          {title}
        </CardTitle>
        <CardDescription className="text-amber-800">{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button asChild variant="outline" className="border-amber-300 bg-white text-amber-900 hover:bg-amber-100">
          <Link href={ctaHref}>
            {ctaLabel}
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
