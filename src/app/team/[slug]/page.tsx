import { existsSync } from "fs";
import path from "path";
import { prisma } from "@/lib/db";
import { TEAMS, TeamSlug, TEAM_API_IDS, RESEARCH_LINKS } from "@/lib/config";
import { computeRankScore } from "@/lib/ranking";
import { currentMlbSeason, pulseNugget } from "@/lib/analytics/season-pulse";
import { fetchSeasonPulse } from "@/lib/sources/mlb-season-pulse";
import { createMLBScoresAdapter } from "@/lib/sources/mlb-scores-adapter";
import { getDailyStatNugget } from "@/lib/analytics/stat-nuggets";
import { notFound } from "next/navigation";
import { TeamPageClient } from "./team-client";
import { fetchTeamStats, fetchTodaysGame, fetchDivisionStandings, fetchSeahawksSeasonSummary, fetchCougarsSeasonSummary, StatsResponse } from "@/lib/stats";

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

  const mlbTeamId = TEAM_API_IDS[params.slug]?.mlbId;
  const season = currentMlbSeason();
  const researchLinks = RESEARCH_LINKS[params.slug as TeamSlug].map((l) => ({
    ...l,
    url: l.url.replace("{season}", season),
  }));

  const [recentArticles, dbGames, metrics, poolNugget, liveStats, todaysGame, standings, pulse, liveGames, nflSummary] = await Promise.all([
    // Pull the most recent articles and rank them below, so recency is
    // scored against today rather than frozen at the time they were stored.
    prisma.article.findMany({
      where: { teamId: team.id },
      orderBy: { publishedAt: "desc" },
      take: 150,
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
    mlbTeamId ? fetchSeasonPulse(mlbTeamId) : Promise.resolve(null),
    // Live schedule so the sidebar agrees with the Next Game panel even
    // before the cron job has stored anything.
    mlbTeamId ? createMLBScoresAdapter().fetchScores!() : Promise.resolve([]),
    // ESPN season summary drives the header for the Seahawks and the Cougars
    // (both non-MLB); MLB teams use `pulse` instead.
    params.slug === "seahawks"
      ? fetchSeahawksSeasonSummary()
      : params.slug === "cougars"
        ? fetchCougarsSeasonSummary()
        : Promise.resolve(null),
  ]);

  const articles = recentArticles
    .map((a) => ({ ...a, rankScore: computeRankScore(a) }))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 30);

  const now = Date.now();
  const games =
    liveGames.length > 0
      ? liveGames
          .filter(
            (g) =>
              (g.status !== "scheduled" && g.gameDate.getTime() >= now - 14 * 86400000) ||
              (g.status === "scheduled" && g.gameDate.getTime() >= now - 6 * 3600000)
          )
          .map((g) => ({
            ...g,
            id: g.externalId ?? `${g.opponent}-${g.gameDate.toISOString()}`,
            venue: g.venue ?? null,
            homeScore: g.homeScore ?? null,
            awayScore: g.awayScore ?? null,
            summary: g.summary ?? null,
            externalId: g.externalId ?? null,
            updatedAt: new Date(now),
            createdAt: new Date(now),
          }))
      : dbGames;

  const livePulseNugget = pulse ? pulseNugget(pulse) : null;
  const nugget = livePulseNugget
    ? { ...livePulseNugget, teamSlug: params.slug, sport: teamConfig.sport }
    : poolNugget;

  const serialized = {
    teamConfig: withAvailablePhotos(teamConfig),
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
    pulse,
    nflSummary,
    hasPulse: mlbTeamId !== undefined,
    researchLinks,
  };

  return <TeamPageClient data={serialized} />;
}

const PHOTO_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];

/**
 * Championship photos are listed in config without an extension; keep the
 * ones that exist in /public (with whichever extension was used), so the
 * banner falls back to its artwork until real photos are added.
 */
function withAvailablePhotos(config: (typeof TEAMS)[TeamSlug]) {
  if (!("championship" in config)) return config;
  const found = config.championship.photos.flatMap((p) => {
    const ext = PHOTO_EXTENSIONS.find((e) =>
      existsSync(path.join(process.cwd(), "public", p.src + e))
    );
    return ext ? [{ ...p, src: p.src + ext }] : [];
  });
  return { ...config, championship: { ...config.championship, photos: found } };
}
