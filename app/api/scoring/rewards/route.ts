import { NextResponse } from "next/server";
import { logServerError } from "@/lib/errors";
import { getActiveRewards, getRewardRedemptionHistory } from "@/lib/scoring/queries";

export async function GET() {
  try {
    const [rewards, redemptions] = await Promise.all([
      getActiveRewards(),
      getRewardRedemptionHistory(20),
    ]);
    return NextResponse.json({ rewards, redemptions });
  } catch (error) {
    logServerError("api.scoring.rewards", error);
    return NextResponse.json({ error: "Unable to load rewards right now." }, { status: 500 });
  }
}

