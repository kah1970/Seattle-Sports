import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  const category = searchParams.get("category");
  const player = searchParams.get("player");

  const where: Record<string, unknown> = {};
  if (team) where.team = { slug: team };
  if (category) where.category = category;
  if (player) where.playerName = { contains: player };

  const metrics = await prisma.metric.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      team: { select: { name: true, slug: true } },
    },
  });

  return NextResponse.json({ metrics });
}
