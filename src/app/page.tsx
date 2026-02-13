import { prisma } from "@/lib/db";
import { getAllDailyNuggets } from "@/lib/analytics/stat-nuggets";
import { DashboardClient } from "./dashboard-client";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [articles, games, nuggets] = await Promise.all([
    prisma.article.findMany({
      orderBy: { rankScore: "desc" },
      take: 30,
      include: {
        team: { select: { name: true, slug: true, sport: true } },
        source: { select: { name: true, reputation: true } },
        tags: { select: { name: true, slug: true } },
        _count: { select: { bookmarks: true } },
      },
    }),
    prisma.gameSchedule.findMany({
      where: {
        gameDate: {
          gte: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { gameDate: "asc" },
      take: 10,
    }),
    Promise.resolve(getAllDailyNuggets()),
  ]);

  const serialized = {
    articles: articles.map((a) => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
      fetchedAt: a.fetchedAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
      bookmarkCount: a._count.bookmarks,
    })),
    games: games.map((g) => ({
      ...g,
      gameDate: g.gameDate.toISOString(),
      updatedAt: g.updatedAt.toISOString(),
      createdAt: g.createdAt.toISOString(),
    })),
    nuggets,
  };

  return <DashboardClient data={serialized} />;
}
