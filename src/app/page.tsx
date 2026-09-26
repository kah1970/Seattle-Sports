import { prisma } from "@/lib/db";
import { getAllDailyNuggets } from "@/lib/analytics/stat-nuggets";
import { DashboardClient } from "./dashboard-client";
import { computeRankScore } from "@/lib/ranking";
import { TEAMS, TEAM_API_IDS } from "@/lib/config";
import { fetchSeasonPulse } from "@/lib/sources/mlb-season-pulse";
import { ordinal, pulseNugget, shortDivision } from "@/lib/analytics/season-pulse";
import { fetchSeahawksSeasonSummary, fetchCougarsSeasonSummary, fetchTodaysGame } from "@/lib/stats";
import { describeGame, TeamStatus } from "@/lib/team-status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [recentArticles, poolNuggets, pulse, nflSummary, cougarsSummary, marinersGame, seahawksGame, cougarsGame] =
    await Promise.all([
      // Rank recent articles against today (stored rankScore is frozen at
      // ingestion time, so old stories would never drop).
      prisma.article.findMany({
        orderBy: { publishedAt: "desc" },
        take: 200,
        include: {
          team: { select: { name: true, slug: true, sport: true } },
          source: { select: { name: true, reputation: true } },
          tags: { select: { name: true, slug: true } },
          _count: { select: { bookmarks: true } },
        },
      }),
      Promise.resolve(getAllDailyNuggets()),
      fetchSeasonPulse(TEAM_API_IDS.mariners.mlbId!),
      fetchSeahawksSeasonSummary(),
      fetchCougarsSeasonSummary(),
      fetchTodaysGame("mariners").catch(() => null),
      fetchTodaysGame("seahawks").catch(() => null),
      fetchTodaysGame("cougars").catch(() => null),
    ]);

  const articles = recentArticles
    .map((a) => ({ ...a, rankScore: computeRankScore(a) }))
    .sort((a, b) => b.rankScore - a.rankScore)
    .slice(0, 30);

  // ── Scoreboard strip: live where we have it, config otherwise ──────────
  const { mariners, seahawks, supersonics, cougars } = TEAMS;
  const teams: TeamStatus[] = [
    {
      slug: "mariners",
      name: mariners.name,
      logo: "/logo-mariners.png",
      colorSecondary: mariners.colorSecondary,
      headline: pulse ? `${pulse.wins}-${pulse.losses}` : mariners.season2025.record,
      label: pulse?.season ?? mariners.season2025.label,
      status: pulse
        ? [
            pulse.divisionRank && pulse.division
              ? `${ordinal(pulse.divisionRank)} ${shortDivision(pulse.division)}`
              : null,
            pulse.verdict.headline,
          ]
            .filter(Boolean)
            .join(" · ")
        : mariners.season2025.finish,
      tone: pulse?.verdict.tone ?? null,
      badge: null,
      next: describeGame(marinersGame),
    },
    {
      slug: "seahawks",
      name: seahawks.name,
      logo: "/logo-seahawks.png",
      colorSecondary: seahawks.colorSecondary,
      headline: nflSummary?.record ?? seahawks.season2025.record,
      label: nflSummary ? String(nflSummary.season) : seahawks.season2025.label,
      status: nflSummary ? nflSummary.standing : seahawks.season2025.finish,
      tone: null,
      badge: `🏆 ${seahawks.championship.title}`,
      next: describeGame(seahawksGame),
    },
    {
      slug: "supersonics",
      name: supersonics.name,
      logo: "/logo-supersonics.png",
      colorSecondary: supersonics.colorSecondary,
      headline: supersonics.season2025.finish,
      label: "",
      status: supersonics.season2025.notes[0] ?? null,
      tone: null,
      badge: null,
      next: null,
    },
    {
      slug: "cougars",
      name: cougars.name,
      logo: "/logo-cougars.png",
      colorSecondary: cougars.colorSecondary,
      // Live football record + standing from ESPN; config is the fallback.
      headline: cougarsSummary?.record ?? cougars.season2025.finish,
      label: cougarsSummary ? String(cougarsSummary.season) : "",
      status: cougarsSummary?.standing ?? `${cougars.season2025.label}: ${cougars.season2025.record}`,
      tone: null,
      badge: null,
      next: describeGame(cougarsGame),
    },
  ];

  // Mariners stat of the day from live data when available
  const marinersNugget = pulse ? pulseNugget(pulse) : null;
  const nuggets = poolNuggets.map((n) =>
    n.teamSlug === "mariners" && marinersNugget ? { ...n, ...marinersNugget } : n
  );

  const serialized = {
    articles: articles.map((a) => ({
      ...a,
      publishedAt: a.publishedAt.toISOString(),
      fetchedAt: a.fetchedAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
      bookmarkCount: a._count.bookmarks,
    })),
    teams,
    nuggets,
    today: new Date().toLocaleDateString("en-US", {
      timeZone: "America/Los_Angeles",
      weekday: "long",
      month: "long",
      day: "numeric",
      year: "numeric",
    }),
  };

  return <DashboardClient data={serialized} />;
}
