import { UpgradePrompt } from "./upgrade-prompt";

type FeatureLockCardProps = {
  featureName: string;
  description: string;
};

export function FeatureLockCard({ featureName, description }: FeatureLockCardProps) {
  return (
    <UpgradePrompt
      title={`${featureName} Locked`}
      description={description}
    />
  );
}
