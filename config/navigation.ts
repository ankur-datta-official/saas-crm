import {
  BarChart3,
  Building2,
  CalendarClock,
  CircleHelp,
  FileText,
  Gauge,
  Handshake,
  KanbanSquare,
  Settings,
  ShieldCheck,
  Users,
  WalletCards,
} from "lucide-react";

export const sidebarItems = [
  { title: "Dashboard", href: "/dashboard", icon: Gauge },
  { title: "Companies / Leads", href: "/companies", icon: Building2 },
  { title: "Contacts", href: "/contacts", icon: Users },
  { title: "Meetings", href: "/meetings", icon: CalendarClock },
  { title: "Follow-ups", href: "/followups", icon: Handshake },
  { title: "Pipeline", href: "/pipeline", icon: KanbanSquare },
  { title: "Documents", href: "/documents", icon: FileText },
  { title: "Need Help", href: "/need-help", icon: CircleHelp },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Team", href: "/team", icon: ShieldCheck },
  { title: "Subscription", href: "/subscription", icon: WalletCards },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export type SidebarItem = (typeof sidebarItems)[number];
