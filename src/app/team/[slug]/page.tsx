import { prisma } from "@/lib/db";
import { TEAMS, TeamSlug } from "@/lib/config";
import { getDailyStatNugget } from "@/lib/analytics/stat-nuggets";
import { notFound } from "next/navigation";
import { TeamPageClient } from "./team-client";
import { fetchTeamStats, fetchTodaysGame, fetchDivisionStandings, StatsResponse } from "@/lib/stats";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return Object.keys(TEAMS).map((slug) => ({ slug }));
}

export default async function TeamPage({
  params,
}: {
  params: { slug: string };
}) {
  const teamConfig = TEAMS[params.slug as TeamSlug];
  if (!teamConfig) notFound();

  const team = await prisma.team.findUnique({
    where: { slug: params.slug },
  });
  if (!team) notFound();

  const [articles, games, metrics, nugget, liveStats, todaysGame, standings] = await Promise.all([
    prisma.article.findMany({
      where: { teamId: team.id },
      orderBy: { rankScore: "desc" },
      take: 30,
      include: {
        team: { select: { name: true, slug: true, sport: true } },
        source: { select: { name: true, reputation: true } },
        tags: { select: { name: true, slug: true } },
        _count: { select: { bookmarks: true } },
      },
    }),
    // Fetch recent results (last 14 days) + upcoming games separately
    // so the sidebar shows current data, not months-old games
    Promise.all([
      prisma.gameSchedule.findMany({
        where: {
          teamSlug: params.slug,
          status: { in: ["final", "live"] },
          gameDate: { gte: new Date(Date.now() - 14 * 86400000) },
        },
        orderBy: { gameDate: "desc" },
        take: 10,
      }),
      prisma.gameSchedule.findMany({
        where: {
          teamSlug: params.slug,
          status: "scheduled",
          gameDate: { gte: new Date() },
        },
        orderBy: { gameDate: "asc" },
        take: 10,
      }),
    ]).then(([recent, upcoming]) => [...recent, ...upcoming]),
    prisma.metric.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.resolve(getDailyStatNugget(params.slug)),
    fetchTeamStats(params.slug).catch((): StatsResponse => ({ team: params.slug, sport: "unknown", season: 2025, fetchedAt: new Date().toISOString() })),
    fetchTodaysGame(params.slug).catch(() => null),
    fetchDivisionStandings(params.slug).catch(() => null),
  ]);

  const serialized = {
    teamConfig,
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
    metrics: metrics.map((m) => ({
      ...m,
      date: m.date?.toISOString() || null,
      createdAt: m.createdAt.toISOString(),
    })),
    nugget,
    liveStats,
    todaysGame,
    standings,
  };

  return <TeamPageClient data={serialized} />;
}
