"use client";

import { Bell, Menu, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type AppTopbarProps = {
  onMenuClick?: () => void;
};

export function AppTopbar({ onMenuClick }: AppTopbarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b bg-background/95 px-4 backdrop-blur md:px-6">
      <Button className="md:hidden" variant="ghost" size="icon" onClick={onMenuClick}>
        <Menu />
        <span className="sr-only">Open navigation</span>
      </Button>
      <div className="hidden w-full max-w-md items-center gap-2 rounded-md border bg-white px-3 md:flex">
        <Search className="size-4 text-muted-foreground" />
        <Input
          className="h-10 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
          placeholder="Search leads, contacts, meetings..."
        />
      </div>
      <div className="ml-auto flex items-center gap-2">
        <Button variant="outline" size="icon">
          <Bell />
          <span className="sr-only">Notifications</span>
        </Button>
        <div className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-semibold text-primary-foreground">
          AM
        </div>
      </div>
    </header>
  );
}
