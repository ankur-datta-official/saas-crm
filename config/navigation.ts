import {
  BarChart3,
  Building2,
  CalendarClock,
  CircleHelp,
  FileText,
  Gift,
  Gauge,
  Handshake,
  KanbanSquare,
  Settings,
  ShieldCheck,
  Trophy,
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
  { title: "Leaderboard", href: "/leaderboard", icon: Trophy },
  { title: "Rewards", href: "/rewards", icon: Gift },
  { title: "Reports", href: "/reports", icon: BarChart3 },
  { title: "Team", href: "/team", icon: ShieldCheck },
  { title: "Subscription", href: "/subscription", icon: WalletCards },
  { title: "Settings", href: "/settings", icon: Settings },
] as const;

export type SidebarItem = (typeof sidebarItems)[number];
