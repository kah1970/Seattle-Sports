"use client";

import { useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { ArticleCard } from "@/components/article-card";
import { GameCard } from "@/components/game-card";
import { StatNuggetCard } from "@/components/stat-nugget-card";
import { Sparkline } from "@/components/sparkline";
import { SectionHeader } from "@/components/section-header";
import { WinLossIndicator } from "@/components/win-loss-indicator";
import { TodaysGameHero } from "@/components/todays-game-hero";
import { DivisionStandings } from "@/components/division-standings";
import { StatLeaderBars } from "@/components/stat-leader-bars";
import { SeasonPulse } from "@/components/season-pulse";
import { GoDeeper } from "@/components/go-deeper";
import { ChampionsBanner, Championship } from "@/components/champions-banner";
import { StatNuggetData } from "@/lib/types";
import { ResearchLink } from "@/lib/config";
import {
  SeasonPulse as SeasonPulseData,
  ordinal,
  shortDivision,
} from "@/lib/analytics/season-pulse";
import { StatsResponse, PlayerStat, TodaysGameData, StandingsData, NflSeasonSummary } from "@/lib/stats";

type FilterType = "all" | "news" | "analysis" | "opinion" | "highlights" | "retrospective" | "spring-training" | "roster-move" | "prospects";
type TimeFilter = "all" | "24h" | "7d" | "30d";
type AlignmentFilter = "all" | "aligned" | "unrated";

interface TeamPageData {
  teamConfig: {
    name: string;
    slug: string;
    sport: string;
    colorPrimary: string;
    colorSecondary: string;
    colorAccent?: string;
    championship?: Championship;
    season2025?: {
      label?: string;
      record: string;
      finish: string;
      notes: readonly string[];
    };
  };
  articles: Array<{
    id: string;
    title: string;
    publisher: string;
    publishedAt: string;
    summary: string | null;
    articleType: string;
    sport: string;
    analysisDepth: number;
    rankScore: number;
    isHighlight: boolean;
    videoUrl: string | null;
    bookmarkCount: number;
    team: { name: string; slug: string; sport: string };
    source: { name: string; reputation: number };
    alignment?: number | null;
    predictedAlignment?: number | null;
  }>;
  games: Array<{
    id: string;
    sport: string;
    teamSlug: string;
    opponent: string;
    gameDate: string;
    isHome: boolean;
    venue: string | null;
    status: string;
    homeScore: number | null;
    awayScore: number | null;
  }>;
  metrics: Array<{
    id: string;
    name: string;
    value: number;
    stringValue: string | null;
    category: string;
    season: string | null;
    playerName: string | null;
  }>;
  nugget: StatNuggetData | null;
  liveStats?: StatsResponse;
  todaysGame?: TodaysGameData | null;
  standings?: StandingsData | null;
  pulse: SeasonPulseData | null;
  nflSummary: NflSeasonSummary | null;
  hasPulse: boolean;
  researchLinks: ResearchLink[];
}

export function TeamPageClient({ data }: { data: TeamPageData }) {
  const { teamConfig, articles, games, metrics, nugget, liveStats, todaysGame, standings, pulse, nflSummary, hasPulse, researchLinks } = data;
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const typeFilter = (searchParams.get("type") as FilterType) || "all";
  const timeFilter = (searchParams.get("time") as TimeFilter) || "all";
  const alignmentFilter = (searchParams.get("align") as AlignmentFilter) || "all";

  const setFilter = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value === "all") {
        params.delete(key);
      } else {
        params.set(key, value);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [searchParams, router, pathname]
  );

  const setTypeFilter = (v: FilterType) => setFilter("type", v);
  const setTimeFilter = (v: TimeFilter) => setFilter("time", v);
  const setAlignmentFilter = (v: AlignmentFilter) => setFilter("align", v);

  const now = Date.now();
  const filtered = articles
    .filter((a) => {
      if (typeFilter !== "all" && a.articleType !== typeFilter) return false;
      if (timeFilter !== "all") {
        const age = now - new Date(a.publishedAt).getTime();
        const ms = {
          "24h": 86400000,
          "7d": 7 * 86400000,
          "30d": 30 * 86400000,
        }[timeFilter];
        if (age > ms) return false;
      }
      if (alignmentFilter === "aligned") {
        const score = a.alignment ?? a.predictedAlignment;
        if (score !== null && score !== undefined && score < 2) return false;
      } else if (alignmentFilter === "unrated") {
        if (a.alignment !== null && a.alignment !== undefined) return false;
      }
      return true;
    })
    .sort((a, b) => b.rankScore - a.rankScore);

  const scheduled = games.filter((g) => g.status === "scheduled");
  const completed = games.filter((g) => g.status === "final");

  // Group metrics by player
  const playerMetrics = new Map<string, typeof metrics>();
  for (const m of metrics) {
    if (!m.playerName) continue;
    if (!playerMetrics.has(m.playerName)) {
      playerMetrics.set(m.playerName, []);
    }
    playerMetrics.get(m.playerName)!.push(m);
  }

  // Header summary: live standings when we have them, config otherwise
  const summary = teamConfig.season2025;
  const header = pulse
    ? {
        label: pulse.season,
        record: `${pulse.wins}-${pulse.losses}`,
        finish: [
          pulse.divisionRank ? ordinal(pulse.divisionRank) : null,
          pulse.division ? shortDivision(pulse.division) : null,
          pulse.gamesBack && pulse.gamesBack !== "-" ? `· ${pulse.gamesBack} GB` : null,
        ]
          .filter(Boolean)
          .join(" "),
        notes: [pulse.verdict.headline, ...(summary?.notes ?? [])],
      }
    : nflSummary
      ? {
          label: String(nflSummary.season),
          record: nflSummary.record,
          finish: nflSummary.standing ?? "",
          notes: summary?.notes ?? [],
        }
    : summary
      ? { label: summary.label ?? "", record: summary.record, finish: summary.finish, notes: summary.notes }
      : null;

  // Determine which stat categories get bar charts
  const battingGroup = liveStats?.leaders?.find((g) => g.category === "Batting");
  const pitchingGroup = liveStats?.leaders?.find((g) => g.category === "Pitching");

  return (
    <div className="space-y-5">
      {/* Team Header Banner */}
      <div
        className="rounded-xl p-6 border overflow-hidden relative"
        style={{
          borderColor: teamConfig.colorSecondary + "50",
          background: `linear-gradient(135deg, ${teamConfig.colorPrimary}50 0%, ${teamConfig.colorSecondary}20 100%)`,
        }}
      >
        <div className="flex items-center gap-6">
          {/* Logo */}
          <div className="shrink-0 w-20 h-20 md:w-24 md:h-24 relative">
            <Image
              src={`/logo-${teamConfig.slug}.png`}
              alt={`${teamConfig.name} logo`}
              fill
              className="object-contain drop-shadow-lg"
              priority
            />
          </div>

          {/* Name + Sport + Win/Loss */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
              {teamConfig.name}
            </h1>
            <p className="text-sm text-gray-400 mt-0.5 mb-2">{teamConfig.sport}</p>
            <WinLossIndicator
              games={completed}
              accentColor={teamConfig.colorSecondary}
            />
          </div>

          {/* Season Summary */}
          {header && (
            <div className="hidden md:flex flex-col items-end gap-1 shrink-0 text-right">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold tabular-nums"
                  style={{ color: teamConfig.colorSecondary }}
                >
                  {header.record}
                </span>
                <span className="text-xs text-gray-400 uppercase tracking-wide">{header.label}</span>
              </div>
              <div
                className="text-sm font-semibold"
                style={{ color: teamConfig.colorAccent ?? teamConfig.colorSecondary }}
              >
                {header.finish}
              </div>
              <ul className="mt-1 space-y-0.5">
                {header.notes.map((note) => (
                  <li key={note} className="text-xs text-gray-400">
                    {note}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Today's Game Hero */}
      {todaysGame?.found && (
        <TodaysGameHero game={todaysGame} teamConfig={teamConfig} />
      )}

      {/* Championship banner */}
      {teamConfig.championship && (
        <ChampionsBanner championship={teamConfig.championship} />
      )}

      {/* Season Pulse + research links */}
      {hasPulse && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <SeasonPulse pulse={pulse} />
          </div>
          <GoDeeper links={researchLinks} />
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 flex-wrap">
          {(["all", "news", "analysis", "opinion", "highlights", "retrospective", "spring-training", "roster-move", "prospects"] as FilterType[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${typeFilter === t
                  ? "bg-blue-500/20 text-blue-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                  }`}
              >
                {t === "all" ? "All" : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            )
          )}
        </div>
        <div className="flex gap-1">
          {(["all", "24h", "7d", "30d"] as TimeFilter[]).map((t) => (
            <button
              key={t}
              onClick={() => setTimeFilter(t)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${timeFilter === t
                ? "bg-green-500/20 text-green-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
            >
              {t === "all" ? "All time" : t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-1 shrink-0">Alignment:</span>
          {(["all", "aligned", "unrated"] as AlignmentFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setAlignmentFilter(f)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${alignmentFilter === f
                ? "bg-green-500/20 text-green-400"
                : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                }`}
            >
              {f === "all" ? "All" : f === "aligned" ? "Aligned (2-3)" : "Unrated"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <SectionHeader
            title="News Feed"
            icon="newspaper"
            count={filtered.length}
            accentColor={teamConfig.colorSecondary}
          />
          <div className="space-y-3">
            {filtered.slice(0, 20).map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                bookmarkCount={article.bookmarkCount}
              />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-sm text-gray-500 py-4">
              No articles match your filters.
            </p>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          {!hasPulse && <GoDeeper links={researchLinks} />}

          {/* Schedule */}
          <div>
            <SectionHeader title="Schedule" icon="calendar" count={scheduled.length} accentColor={teamConfig.colorSecondary} />
            {scheduled.length > 0 ? (
              <div className="space-y-2">
                {scheduled.slice(0, 5).map((g) => (
                  <GameCard key={g.id} {...g} colorSecondary={teamConfig.colorSecondary} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming games</p>
            )}
          </div>

          {/* Recent Results */}
          {completed.length > 0 && (
            <div>
              <SectionHeader title="Recent Results" icon="trophy" accentColor={teamConfig.colorSecondary} />
              <div className="space-y-2">
                {completed.slice(0, 5).map((g) => (
                  <GameCard key={g.id} {...g} colorSecondary={teamConfig.colorSecondary} />
                ))}
              </div>
            </div>
          )}

          {/* Division Standings */}
          {standings && (
            <div>
              <SectionHeader title={standings.divisionName} icon="chart" accentColor={teamConfig.colorSecondary} />
              <DivisionStandings standings={standings} teamConfig={teamConfig} />
            </div>
          )}

          {/* Stat Nugget */}
          {nugget && (
            <div>
              <SectionHeader title="Stat of the Day" icon="target" accentColor={teamConfig.colorSecondary} />
              <StatNuggetCard {...nugget} />
            </div>
          )}

          {/* Stat Leader Bars + Tables */}
          {liveStats && !liveStats.error && (
            <div className="space-y-5">
              {/* Batting Leaders with bar chart */}
              {battingGroup && battingGroup.players.length > 0 && (
                <div>
                  <SectionHeader
                    title="Batting"
                    icon="chart"
                    subtitle={String(liveStats.season)}
                    accentColor={teamConfig.colorSecondary}
                  />
                  <div className="space-y-3">
                    <div className="card">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Home Runs</div>
                      <StatLeaderBars players={battingGroup.players} stat="HR" accentColor={teamConfig.colorSecondary} />
                    </div>
                    <div className="card overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                            <th className="pb-2 pr-3 font-medium">Player</th>
                            {Object.keys(battingGroup.players[0]?.stats ?? {}).map((k) => (
                              <th key={k} className="pb-2 px-1 font-medium text-center">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {battingGroup.players.map((player: PlayerStat) => (
                            <tr key={player.name} className="text-gray-400 hover:text-white transition-colors">
                              <td className="py-1.5 pr-3 font-medium text-gray-300">{player.name}</td>
                              {Object.values(player.stats).map((v, i) => (
                                <td key={i} className="py-1.5 px-1 text-center tabular-nums text-xs">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Pitching Leaders with bar chart */}
              {pitchingGroup && pitchingGroup.players.length > 0 && (
                <div>
                  <SectionHeader
                    title="Pitching"
                    icon="chart"
                    subtitle={String(liveStats.season)}
                    accentColor={teamConfig.colorSecondary}
                  />
                  <div className="space-y-3">
                    <div className="card">
                      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2">Strikeouts</div>
                      <StatLeaderBars players={pitchingGroup.players} stat="SO" accentColor={teamConfig.colorSecondary} />
                    </div>
                    <div className="card overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                            <th className="pb-2 pr-3 font-medium">Player</th>
                            {Object.keys(pitchingGroup.players[0]?.stats ?? {}).map((k) => (
                              <th key={k} className="pb-2 px-1 font-medium text-center">{k}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {pitchingGroup.players.map((player: PlayerStat) => (
                            <tr key={player.name} className="text-gray-400 hover:text-white transition-colors">
                              <td className="py-1.5 pr-3 font-medium text-gray-300">{player.name}</td>
                              {Object.values(player.stats).map((v, i) => (
                                <td key={i} className="py-1.5 px-1 text-center tabular-nums text-xs">{String(v)}</td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}

              {/* Other stat groups (non-batting/pitching) */}
              {liveStats.leaders?.filter((g) => g.category !== "Batting" && g.category !== "Pitching").map((group) => (
                <div key={group.category}>
                  <SectionHeader title={group.category} subtitle={String(liveStats.season)} accentColor={teamConfig.colorSecondary} />
                  <div className="card overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                          <th className="pb-2 pr-3 font-medium">Player</th>
                          {Object.keys(group.players[0]?.stats ?? {}).map((k) => (
                            <th key={k} className="pb-2 px-1 font-medium text-center">{k}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-white/5">
                        {group.players.map((player: PlayerStat) => (
                          <tr key={player.name} className="text-gray-400 hover:text-white transition-colors">
                            <td className="py-1.5 pr-3 font-medium text-gray-300">{player.name}</td>
                            {Object.values(player.stats).map((v, i) => (
                              <td key={i} className="py-1.5 px-1 text-center tabular-nums text-xs">{String(v)}</td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Active Roster */}
              {liveStats.roster && liveStats.roster.length > 0 && (
                <div>
                  <SectionHeader title="Active Roster" icon="users" count={liveStats.roster.length} accentColor={teamConfig.colorSecondary} />
                  <div className="card grid grid-cols-1 gap-0.5">
                    {liveStats.roster.slice(0, 30).map((p) => (
                      <div key={p.name} className="flex items-center gap-2 py-1 px-1 rounded hover:bg-white/5">
                        {p.jerseyNumber && <span className="text-xs text-gray-600 w-5 text-right shrink-0">#{p.jerseyNumber}</span>}
                        <span className="text-sm text-gray-300 flex-1 truncate">{p.name}</span>
                        <span className="text-xs text-gray-500 shrink-0">{p.position}</span>
                        {p.status && <span className="text-xs text-red-400 bg-red-900/30 px-1 rounded">{p.status}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-xs text-gray-600 text-right">
                Via {liveStats.sport === "MLB" ? "MLB Stats API" : "ESPN API"}
              </p>
            </div>
          )}

          {/* Player Stats (from imported metrics) */}
          {playerMetrics.size > 0 && (
            <div>
              <SectionHeader title="Key Stats" icon="chart" accentColor={teamConfig.colorSecondary} />
              <div className="space-y-3">
                {Array.from(playerMetrics.entries())
                  .slice(0, 6)
                  .map(([player, pMetrics]) => (
                    <div key={player} className="card">
                      <h3 className="text-sm font-semibold text-gray-200 mb-2">
                        {player}
                      </h3>
                      <div className="grid grid-cols-2 gap-2">
                        {pMetrics.slice(0, 4).map((m) => (
                          <div key={m.id}>
                            <span className="text-xs text-gray-500 uppercase">
                              {m.name}
                            </span>
                            <div className="text-sm font-mono text-gray-200">
                              {m.stringValue || formatMetric(m.name, m.value)}
                            </div>
                          </div>
                        ))}
                      </div>
                      {pMetrics.length >= 3 && (
                        <div className="mt-2">
                          <Sparkline
                            data={pMetrics.map((m) => m.value)}
                            color={teamConfig.colorSecondary}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>{/* end sidebar */}
      </div>{/* end grid */}
    </div>
  );
}

function formatMetric(name: string, value: number): string {
  if (["avg", "obp", "slg"].includes(name)) return value.toFixed(3);
  if (["era", "fip", "whip"].includes(name)) return value.toFixed(2);
  if (name.includes("rate") || name.includes("pct")) return (value * 100).toFixed(1) + "%";
  if (Number.isInteger(value)) return value.toString();
  return value.toFixed(1);
}
