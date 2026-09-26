import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/digest?date=YYYY-MM-DD
 * Returns the daily digest. If none exists for today, generates one.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const date =
    searchParams.get("date") || new Date().toISOString().split("T")[0];

  const teams = await prisma.team.findMany();
  const digests = [];

  for (const team of teams) {
    let digest = await prisma.digestSnapshot.findUnique({
      where: {
        date_teamId: { date, teamId: team.id },
      },
    });

    if (!digest) {
      // Generate digest for this team
      const topArticles = await prisma.article.findMany({
        where: {
          teamId: team.id,
          publishedAt: {
            gte: new Date(date + "T00:00:00Z"),
            lt: new Date(
              new Date(date + "T00:00:00Z").getTime() + 86400000
            ),
          },
        },
        orderBy: { rankScore: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          publisher: true,
          articleType: true,
          rankScore: true,
          url: true,
          summary: true,
        },
      });

      digest = await prisma.digestSnapshot.create({
        data: {
          date,
          teamId: team.id,
          content: JSON.stringify(topArticles),
        },
      });
    }

    digests.push({
      team: { name: team.name, slug: team.slug, sport: team.sport },
      date: digest.date,
      items: JSON.parse(digest.content),
    });
  }

  return NextResponse.json({ date, digests });
}
