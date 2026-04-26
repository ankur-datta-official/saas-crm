import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type CrmSettingsCardProps = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

export function CrmSettingsCard({ title, description, href, icon: Icon }: CrmSettingsCardProps) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-4 p-5">
        <div className="flex min-w-0 gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <h2 className="font-semibold">{title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{description}</p>
          </div>
        </div>
        <Button asChild variant="outline">
          <Link href={href}>Manage</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
