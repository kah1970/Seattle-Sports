import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  const sport = searchParams.get("sport");

  const where: Record<string, unknown> = {};
  if (team) where.teamSlug = team;
  if (sport) where.sport = sport;

  const games = await prisma.gameSchedule.findMany({
    where,
    orderBy: { gameDate: "asc" },
    take: 20,
  });

  return NextResponse.json({ games });
}
