import { PageHeader } from "@/components/shared/page-header";
import { RewardsMarketplace } from "@/components/scoring/scoring-ui";
import { requireOrganization } from "@/lib/auth/session";
import { getActiveRewards, getCurrentUserWalletSummary, getRewardRedemptionHistory } from "@/lib/scoring/queries";

export default async function RewardsPage() {
  await requireOrganization();
  const [summary, rewards, redemptions] = await Promise.all([
    getCurrentUserWalletSummary(),
    getActiveRewards(),
    getRewardRedemptionHistory(20),
  ]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Rewards"
        description="Redeem your points for badges, premium features, and admin-fulfilled rewards."
      />
      <RewardsMarketplace summary={summary} rewards={rewards} redemptions={redemptions} />
    </div>
  );
}

