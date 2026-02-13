import { prisma } from "@/lib/db";
import { TEAMS, TeamSlug } from "@/lib/config";
import { getDailyStatNugget } from "@/lib/analytics/stat-nuggets";
import { notFound } from "next/navigation";
import { TeamPageClient } from "./team-client";

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

  const [articles, games, metrics, nugget] = await Promise.all([
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
    prisma.gameSchedule.findMany({
      where: { teamSlug: params.slug },
      orderBy: { gameDate: "asc" },
      take: 15,
    }),
    prisma.metric.findMany({
      where: { teamId: team.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    Promise.resolve(getDailyStatNugget(params.slug)),
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
  };

  return <TeamPageClient data={serialized} />;
}
