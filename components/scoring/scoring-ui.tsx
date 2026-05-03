"use client";

import { useMemo, useState, useTransition } from "react";
import { Gift, Loader2, Medal, ShieldCheck, Sparkles, Target, Trophy, Wallet } from "lucide-react";
import { useRouter } from "next/navigation";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { UserAvatar } from "@/components/shared/user-avatar";
import {
  adjustWalletBalanceAction,
  archiveChallengeTemplateAction,
  archiveLeadSourceScoreRuleAction,
  archiveLeadScoreRuleAction,
  archiveRewardAction,
  fulfillRewardRedemptionAction,
  redeemRewardAction,
  updateLeadSourceScoreRuleAction,
  updateChallengeTemplateAction,
  updateLeadScoreRuleAction,
  updateRewardAction,
} from "@/lib/scoring/actions";
import type {
  ChallengeTemplate,
  LeaderboardEntry,
  LeadSourceScoreRule,
  LeadScoreRule,
  Reward,
  RewardRedemption,
  ScoringActivityLog,
  UserChallengeProgress,
  WalletSummary,
} from "@/lib/scoring/types";

function formatDateTime(value?: string | null) {
  if (!value) return "-";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function scoreTone(points: number) {
  if (points > 0) return "text-emerald-700";
  if (points < 0) return "text-rose-700";
  return "text-slate-600";
}

function rewardTypeLabel(type: Reward["reward_type"]) {
  switch (type) {
    case "badge":
      return "Badge";
    case "discount":
      return "Discount";
    case "premium_feature":
      return "Premium Feature";
    default:
      return "Manual Reward";
  }
}

export function WalletSummaryPanel({
  summary,
  compact = false,
}: {
  summary: WalletSummary | null;
  compact?: boolean;
}) {
  const activeChallengeCount = summary?.challenge_progress.filter((item) => !item.is_completed).length ?? 0;
  const badgeCount = summary?.badges.length ?? 0;
  const streak = summary?.streaks[0];

  return (
    <Card className="rounded-2xl border-slate-200 bg-white">
      <CardHeader className={compact ? "pb-3" : undefined}>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Wallet className="size-5 text-amber-600" />
          Wallet Balance
        </CardTitle>
        <CardDescription>
          Track your earned points, current challenges, and reward momentum.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-emerald-50 p-5">
          <p className="text-sm font-medium text-slate-600">Available points</p>
          <p className="mt-2 text-4xl font-semibold tracking-tight text-slate-900">
            {summary?.wallet_balance ?? 0}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            Lifetime earned: <span className="font-medium text-slate-700">{summary?.wallet_lifetime_earned ?? 0}</span>
          </p>
        </div>
        <div className={`grid gap-3 ${compact ? "sm:grid-cols-3" : "sm:grid-cols-2 lg:grid-cols-3"}`}>
          <MiniInfo icon={Target} label="Active challenges" value={String(activeChallengeCount)} />
          <MiniInfo icon={Medal} label="Badges earned" value={String(badgeCount)} />
          <MiniInfo icon={Sparkles} label="Current streak" value={streak ? `${streak.current_streak} days` : "0 days"} />
        </div>
      </CardContent>
    </Card>
  );
}

function MiniInfo({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Trophy;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon className="size-4" />
        <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export function LeaderboardPanel({
  entries,
  title = "Leaderboard",
  description = "Top scorers in the workspace right now.",
}: {
  entries: LeaderboardEntry[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-slate-900">
          <Trophy className="size-5 text-amber-600" />
          {title}
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No scoring activity yet.</p>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <div key={entry.user_id} className="flex items-center gap-3 rounded-2xl border border-slate-200 p-3">
                <div className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-sm font-semibold text-slate-700">
                  #{entry.rank}
                </div>
                <UserAvatar
                  imageUrl={entry.avatar_url}
                  fullName={entry.full_name}
                  email={entry.email}
                  className="size-10"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-900">{entry.full_name ?? entry.email}</p>
                  <p className="truncate text-sm text-slate-500">{entry.period_points} pts this period</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-slate-900">{entry.wallet_balance}</p>
                  <p className="text-xs text-slate-500">balance</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ScoringActivityPanel({
  activities,
  title = "Scoring Activity",
  description = "Recent point changes, bonuses, and redemptions.",
}: {
  activities: ScoringActivityLog[];
  title?: string;
  description?: string;
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="text-sm text-slate-500">No scoring activity recorded yet.</p>
        ) : (
          <div className="space-y-3">
            {activities.map((activity) => (
              <div key={activity.id} className="rounded-2xl border border-slate-200 p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="font-medium text-slate-900">{activity.title}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {activity.description || activity.action_key.replaceAll("_", " ")}
                    </p>
                    <p className="mt-2 text-xs uppercase tracking-wide text-slate-400">
                      {formatDateTime(activity.created_at)}
                    </p>
                  </div>
                  <p className={`shrink-0 text-sm font-semibold ${scoreTone(activity.points_delta)}`}>
                    {activity.points_delta > 0 ? "+" : ""}
                    {activity.points_delta} pts
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ChallengeProgressPanel({
  challenges,
}: {
  challenges: UserChallengeProgress[];
}) {
  return (
    <Card className="rounded-2xl">
      <CardHeader>
        <CardTitle>Challenge Progress</CardTitle>
        <CardDescription>Daily and weekly bonus progress tracked from your scoring events.</CardDescription>
      </CardHeader>
      <CardContent>
        {challenges.length === 0 ? (
          <p className="text-sm text-slate-500">No challenge progress yet.</p>
        ) : (
          <div className="space-y-3">
            {challenges.map((challenge) => {
              const ratio = Math.min(100, Math.round((challenge.progress_count / Math.max(challenge.target_count, 1)) * 100));
              return (
                <div key={challenge.id} className="rounded-2xl border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-slate-900">{challenge.name ?? "Challenge"}</p>
                      <p className="mt-1 text-sm text-slate-500">
                        {challenge.progress_count}/{challenge.target_count} completed
                      </p>
                    </div>
                    <Badge variant={challenge.is_completed ? "success" : "secondary"}>
                      {challenge.is_completed ? "Completed" : challenge.cadence ?? "Active"}
                    </Badge>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-emerald-500" style={{ width: `${ratio}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function RewardsMarketplace({
  summary,
  rewards,
  redemptions,
}: {
  summary: WalletSummary | null;
  rewards: Reward[];
  redemptions: RewardRedemption[];
}) {
  const router = useRouter();
  const [pendingRewardId, setPendingRewardId] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <div className="space-y-6">
      <WalletSummaryPanel summary={summary} compact />
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Reward redemption failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertTitle>Reward redeemed</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}
      <div className="grid gap-4 lg:grid-cols-2">
        {rewards.map((reward) => {
          const canRedeem = (summary?.wallet_balance ?? 0) >= reward.cost_points && reward.is_active;
          const disabled = !canRedeem || isPending;

          return (
            <Card key={reward.id} className="rounded-2xl">
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-2">
                    <CardTitle className="text-slate-900">{reward.name}</CardTitle>
                    <CardDescription>{reward.description ?? "Reward available for redemption."}</CardDescription>
                  </div>
                  <Badge variant="info">{rewardTypeLabel(reward.reward_type)}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-slate-500">Cost</p>
                    <p className="text-xl font-semibold text-slate-900">{reward.cost_points} pts</p>
                  </div>
                  <Gift className="size-6 text-amber-600" />
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Fulfillment</span>
                  <span className="font-medium text-slate-700">{reward.fulfillment_mode}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-slate-500">
                  <span>Inventory</span>
                  <span className="font-medium text-slate-700">{reward.inventory ?? "Unlimited"}</span>
                </div>
                <Button
                  className="w-full"
                  disabled={disabled}
                  onClick={() => {
                    setError(null);
                    setMessage(null);
                    setPendingRewardId(reward.id);
                    startTransition(async () => {
                      const result = await redeemRewardAction(reward.id);
                      if (!result.ok) {
                        setError(result.error ?? "Unable to redeem reward.");
                        setPendingRewardId(null);
                        return;
                      }
                      setMessage(`You redeemed "${reward.name}".`);
                      setPendingRewardId(null);
                      router.refresh();
                    });
                  }}
                >
                  {isPending && pendingRewardId === reward.id ? <Loader2 className="animate-spin" /> : <Gift />}
                  {canRedeem ? "Redeem Reward" : "Not enough points"}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="rounded-2xl">
        <CardHeader>
          <CardTitle>Redemption History</CardTitle>
          <CardDescription>Track pending and fulfilled rewards for your account.</CardDescription>
        </CardHeader>
        <CardContent>
          {redemptions.length === 0 ? (
            <p className="text-sm text-slate-500">No rewards redeemed yet.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Reward</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Created</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {redemptions.map((redemption) => (
                  <TableRow key={redemption.id}>
                    <TableCell>{redemption.rewards_catalog?.name ?? redemption.reward_id}</TableCell>
                    <TableCell>
                      <Badge variant={redemption.status === "fulfilled" ? "success" : redemption.status === "pending" ? "warning" : "secondary"}>
                        {redemption.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{redemption.points_spent}</TableCell>
                    <TableCell>{formatDateTime(redemption.created_at)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ScoringAdminPanel({
  rules,
  sourceRules,
  rewards,
  challenges,
  redemptions,
  walletLeaders,
}: {
  rules: LeadScoreRule[];
  sourceRules: LeadSourceScoreRule[];
  rewards: Reward[];
  challenges: ChallengeTemplate[];
  redemptions: RewardRedemption[];
  walletLeaders: LeaderboardEntry[];
}) {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [adjustUserId, setAdjustUserId] = useState("");
  const [adjustPoints, setAdjustPoints] = useState("0");
  const [adjustReason, setAdjustReason] = useState("");

  const rewardRedemptionPendingCount = useMemo(
    () => redemptions.filter((item) => item.status === "pending").length,
    [redemptions],
  );

  function handleAsync(run: () => Promise<void>) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      try {
        await run();
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to complete scoring update.");
      }
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <Alert variant="destructive">
          <AlertTitle>Scoring update failed</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
      {message ? (
        <Alert>
          <AlertTitle>Scoring updated</AlertTitle>
          <AlertDescription>{message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 md:grid-cols-3">
        <MiniInfo icon={ShieldCheck} label="Scoring rules" value={String(rules.length)} />
        <MiniInfo icon={Gift} label="Rewards pending" value={String(rewardRedemptionPendingCount)} />
        <MiniInfo icon={Trophy} label="Leaderboard users" value={String(walletLeaders.length)} />
      </div>

      <Tabs defaultValue="rules" className="space-y-4">
        <TabsList>
          <TabsTrigger value="rules">Point Rules</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="challenges">Challenges</TabsTrigger>
          <TabsTrigger value="adjustments">Adjust Wallet</TabsTrigger>
        </TabsList>

        <TabsContent value="rules">
          <div className="space-y-6">
            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Lead Scoring Rules</CardTitle>
                <CardDescription>Adjust point allocations for scoring events.</CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Rule</TableHead>
                      <TableHead>Points</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="w-48">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rules.map((rule) => (
                      <TableRow key={rule.id}>
                        <TableCell>
                          <p className="font-medium text-slate-900">{rule.name}</p>
                          <p className="text-xs text-slate-500">{rule.action_key}</p>
                        </TableCell>
                        <TableCell>
                          <InlineNumberForm
                            defaultValue={rule.points}
                            isPending={isPending}
                            onSave={(nextValue) => handleAsync(async () => {
                              const result = await updateLeadScoreRuleAction(rule.id, {
                                action_key: rule.action_key,
                                name: rule.name,
                                description: rule.description,
                                points: nextValue,
                                is_active: rule.is_active,
                                rule_scope: rule.rule_scope,
                              });
                              if (!result.ok) throw new Error(result.error);
                              setMessage(`Updated ${rule.name}.`);
                            })}
                          />
                        </TableCell>
                        <TableCell>
                          <Badge variant={rule.is_active ? "success" : "secondary"}>
                            {rule.is_active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleAsync(async () => {
                              const result = await archiveLeadScoreRuleAction(rule.id);
                              if (!result.ok) throw new Error(result.error);
                              setMessage(`${rule.name} archived.`);
                            })}
                          >
                            Archive
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <Card className="rounded-2xl">
              <CardHeader>
                <CardTitle>Lead Source Bonuses</CardTitle>
                <CardDescription>Adjust source-based scoring boosts such as LinkedIn or website leads.</CardDescription>
              </CardHeader>
              <CardContent>
                {sourceRules.length === 0 ? (
                  <p className="text-sm text-slate-500">No source bonus rules configured yet.</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Source</TableHead>
                        <TableHead>Bonus</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="w-48">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sourceRules.map((rule) => (
                        <TableRow key={rule.id}>
                          <TableCell>
                            <p className="font-medium text-slate-900">{rule.source_name}</p>
                            <p className="text-xs text-slate-500">{rule.normalized_source}</p>
                          </TableCell>
                          <TableCell>
                            <InlineNumberForm
                              defaultValue={rule.bonus_points}
                              isPending={isPending}
                              onSave={(nextValue) => handleAsync(async () => {
                                const result = await updateLeadSourceScoreRuleAction(rule.id, {
                                  source_name: rule.source_name,
                                  bonus_points: nextValue,
                                  is_active: rule.is_active,
                                  rule_scope: rule.rule_scope,
                                });
                                if (!result.ok) throw new Error(result.error);
                                setMessage(`Updated ${rule.source_name} bonus.`);
                              })}
                            />
                          </TableCell>
                          <TableCell>
                            <Badge variant={rule.is_active ? "success" : "secondary"}>
                              {rule.is_active ? "Active" : "Inactive"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              type="button"
                              variant="outline"
                              disabled={isPending}
                              onClick={() => handleAsync(async () => {
                                const result = await archiveLeadSourceScoreRuleAction(rule.id);
                                if (!result.ok) throw new Error(result.error);
                                setMessage(`${rule.source_name} bonus archived.`);
                              })}
                            >
                              Archive
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="rewards">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Rewards & Thresholds</CardTitle>
              <CardDescription>Control reward pricing and fulfillment status.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Reward</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Inventory</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rewards.map((reward) => (
                    <TableRow key={reward.id}>
                      <TableCell>
                        <p className="font-medium text-slate-900">{reward.name}</p>
                        <p className="text-xs text-slate-500">{rewardTypeLabel(reward.reward_type)}</p>
                      </TableCell>
                      <TableCell>
                        <InlineNumberForm
                          defaultValue={reward.cost_points}
                          isPending={isPending}
                          onSave={(nextValue) => handleAsync(async () => {
                            const result = await updateRewardAction(reward.id, {
                              ...reward,
                              cost_points: nextValue,
                            });
                            if (!result.ok) throw new Error(result.error);
                            setMessage(`Updated ${reward.name}.`);
                          })}
                        />
                      </TableCell>
                      <TableCell>{reward.inventory ?? "Unlimited"}</TableCell>
                      <TableCell>
                        <Badge variant={reward.is_active ? "success" : "secondary"}>{reward.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAsync(async () => {
                            const result = await archiveRewardAction(reward.id);
                            if (!result.ok) throw new Error(result.error);
                            setMessage(`${reward.name} archived.`);
                          })}
                        >
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              <div className="space-y-3">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-500">Pending Redemptions</h3>
                {redemptions.length === 0 ? (
                  <p className="text-sm text-slate-500">No redemption requests yet.</p>
                ) : (
                  <div className="space-y-3">
                    {redemptions.map((redemption) => (
                      <div key={redemption.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 lg:flex-row lg:items-center lg:justify-between">
                        <div>
                          <p className="font-medium text-slate-900">{redemption.rewards_catalog?.name ?? redemption.reward_id}</p>
                          <p className="text-sm text-slate-500">
                            {redemption.points_spent} pts • {redemption.status} • {formatDateTime(redemption.created_at)}
                          </p>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            size="sm"
                            disabled={isPending}
                            onClick={() => handleAsync(async () => {
                              const result = await fulfillRewardRedemptionAction(redemption.id, "fulfilled");
                              if (!result.ok) throw new Error(result.error);
                              setMessage("Redemption fulfilled.");
                            })}
                          >
                            Fulfill
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            disabled={isPending}
                            onClick={() => handleAsync(async () => {
                              const result = await fulfillRewardRedemptionAction(redemption.id, "rejected");
                              if (!result.ok) throw new Error(result.error);
                              setMessage("Redemption rejected.");
                            })}
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="challenges">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Challenges</CardTitle>
              <CardDescription>Maintain bonus thresholds for daily and weekly gamification.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Challenge</TableHead>
                    <TableHead>Target</TableHead>
                    <TableHead>Bonus</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-40">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {challenges.map((challenge) => (
                    <TableRow key={challenge.id}>
                      <TableCell>
                        <p className="font-medium text-slate-900">{challenge.name}</p>
                        <p className="text-xs text-slate-500">{challenge.target_metric} • {challenge.cadence}</p>
                      </TableCell>
                      <TableCell>{challenge.target_count}</TableCell>
                      <TableCell>
                        <InlineNumberForm
                          defaultValue={challenge.bonus_points}
                          isPending={isPending}
                          onSave={(nextValue) => handleAsync(async () => {
                            const result = await updateChallengeTemplateAction(challenge.id, {
                              ...challenge,
                              bonus_points: nextValue,
                            });
                            if (!result.ok) throw new Error(result.error);
                            setMessage(`Updated ${challenge.name}.`);
                          })}
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={challenge.is_active ? "success" : "secondary"}>{challenge.is_active ? "Active" : "Inactive"}</Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          variant="outline"
                          disabled={isPending}
                          onClick={() => handleAsync(async () => {
                            const result = await archiveChallengeTemplateAction(challenge.id);
                            if (!result.ok) throw new Error(result.error);
                            setMessage(`${challenge.name} archived.`);
                          })}
                        >
                          Archive
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="adjustments">
          <Card className="rounded-2xl">
            <CardHeader>
              <CardTitle>Manual Wallet Adjustment</CardTitle>
              <CardDescription>Apply admin corrections or one-off bonus changes with an audit reason.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="adjust-user-id">User ID</Label>
                  <Input id="adjust-user-id" value={adjustUserId} onChange={(event) => setAdjustUserId(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjust-points">Points Delta</Label>
                  <Input id="adjust-points" type="number" value={adjustPoints} onChange={(event) => setAdjustPoints(event.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="adjust-reason">Reason</Label>
                  <Input id="adjust-reason" value={adjustReason} onChange={(event) => setAdjustReason(event.target.value)} />
                </div>
              </div>
              <Button
                type="button"
                disabled={isPending || !adjustUserId.trim() || !adjustReason.trim()}
                onClick={() => handleAsync(async () => {
                  const result = await adjustWalletBalanceAction(
                    adjustUserId.trim(),
                    Number(adjustPoints || "0"),
                    adjustReason.trim(),
                  );
                  if (!result.ok) throw new Error(result.error);
                  setMessage("Wallet adjusted successfully.");
                  setAdjustReason("");
                })}
              >
                {isPending ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                Apply Adjustment
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function InlineNumberForm({
  defaultValue,
  onSave,
  isPending,
}: {
  defaultValue: number;
  onSave: (value: number) => void;
  isPending: boolean;
}) {
  const [value, setValue] = useState(String(defaultValue));

  return (
    <div className="flex items-center gap-2">
      <Input
        type="number"
        className="w-24"
        value={value}
        onChange={(event) => setValue(event.target.value)}
      />
      <Button type="button" size="sm" variant="outline" disabled={isPending} onClick={() => onSave(Number(value || "0"))}>
        Save
      </Button>
    </div>
  );
}
