import { NextRequest, NextResponse } from "next/server";
import { logServerError } from "@/lib/errors";
import { getWalletLeaderboard } from "@/lib/scoring/queries";

export async function GET(request: NextRequest) {
  const period = (request.nextUrl.searchParams.get("period") ?? "all_time") as "all_time" | "weekly" | "daily";
  const limit = Number(request.nextUrl.searchParams.get("limit") ?? "10");

  try {
    const leaderboard = await getWalletLeaderboard(period, limit);
    return NextResponse.json(leaderboard);
  } catch (error) {
    logServerError("api.scoring.leaderboard", error, { period, limit });
    return NextResponse.json({ error: "Unable to load leaderboard right now." }, { status: 500 });
  }
}

