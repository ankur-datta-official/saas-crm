import { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  actionLabel?: string;
};

export function EmptyState({ title, description, icon: Icon, actionLabel }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="flex min-h-72 flex-col items-center justify-center p-8 text-center">
        <div className="flex size-12 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <Icon className="size-6" />
        </div>
        <h2 className="mt-4 text-lg font-semibold">{title}</h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">{description}</p>
        {actionLabel ? (
          <Button className="mt-5" type="button">
            {actionLabel}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
