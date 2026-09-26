import { NextResponse } from "next/server";
import { getDailyStatNugget, getAllDailyNuggets } from "@/lib/analytics/stat-nuggets";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");

  if (team) {
    const nugget = getDailyStatNugget(team);
    return NextResponse.json({ nugget });
  }

  const nuggets = getAllDailyNuggets();
  return NextResponse.json({ nuggets });
}
