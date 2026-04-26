import { WalletCards } from "lucide-react";
import { ModulePlaceholder } from "@/components/shared/module-placeholder";

export default function SubscriptionPage() {
  return (
    <ModulePlaceholder
      title="Subscription"
      description="Review plan status, billing controls, limits, and workspace subscription details."
      emptyTitle="Subscription controls are not connected yet"
      emptyDescription="Billing provider integration and plan enforcement can attach to this page later."
      icon={WalletCards}
    />
  );
}
