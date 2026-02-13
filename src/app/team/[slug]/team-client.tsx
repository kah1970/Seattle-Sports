"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { GameCard } from "@/components/game-card";
import { StatNuggetCard } from "@/components/stat-nugget-card";
import { RankingSlider } from "@/components/ranking-slider";
import { Sparkline } from "@/components/sparkline";
import { StatNuggetData } from "@/lib/types";

type FilterType = "all" | "news" | "analysis" | "opinion" | "highlights" | "retrospective";
type TimeFilter = "all" | "24h" | "7d" | "30d";

interface TeamPageData {
  teamConfig: {
    name: string;
    slug: string;
    sport: string;
    colorPrimary: string;
    colorSecondary: string;
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
}

export function TeamPageClient({ data }: { data: TeamPageData }) {
  const { teamConfig, articles, games, metrics, nugget } = data;
  const [typeFilter, setTypeFilter] = useState<FilterType>("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("all");
  const [slider, setSlider] = useState(0.5);
  const [depthRange, setDepthRange] = useState([0, 100]);

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
      const depth = a.analysisDepth * 100;
      if (depth < depthRange[0] || depth > depthRange[1]) return false;
      return true;
    })
    .sort((a, b) => {
      const aScore = a.rankScore * (1 - slider) + a.analysisDepth * slider;
      const bScore = b.rankScore * (1 - slider) + b.analysisDepth * slider;
      return bScore - aScore;
    });

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

  return (
    <div className="space-y-6">
      {/* Team Header */}
      <div
        className="rounded-lg p-6 border"
        style={{
          borderColor: teamConfig.colorSecondary + "40",
          background: `linear-gradient(135deg, ${teamConfig.colorPrimary}30, ${teamConfig.colorSecondary}15)`,
        }}
      >
        <h1 className="text-2xl font-bold">{teamConfig.name}</h1>
        <p className="text-sm text-gray-400 mt-1">{teamConfig.sport}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {(["all", "news", "analysis", "opinion", "highlights", "retrospective"] as FilterType[]).map(
            (t) => (
              <button
                key={t}
                onClick={() => setTypeFilter(t)}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                  typeFilter === t
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
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                timeFilter === t
                  ? "bg-green-500/20 text-green-400"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              {t === "all" ? "All time" : t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Depth:</span>
          <input
            type="range"
            min={0}
            max={100}
            value={depthRange[0]}
            onChange={(e) =>
              setDepthRange([parseInt(e.target.value), depthRange[1]])
            }
            className="w-16 h-1 bg-gray-700 rounded appearance-none accent-purple-500"
            aria-label="Minimum analysis depth"
          />
          <input
            type="range"
            min={0}
            max={100}
            value={depthRange[1]}
            onChange={(e) =>
              setDepthRange([depthRange[0], parseInt(e.target.value)])
            }
            className="w-16 h-1 bg-gray-700 rounded appearance-none accent-purple-500"
            aria-label="Maximum analysis depth"
          />
        </div>
        <RankingSlider value={slider} onChange={setSlider} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            News Feed ({filtered.length})
          </h2>
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
        <div className="space-y-4">
          {/* Schedule */}
          <div>
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Schedule
            </h2>
            {scheduled.length > 0 ? (
              <div className="space-y-2">
                {scheduled.slice(0, 5).map((g) => (
                  <GameCard key={g.id} {...g} />
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500">No upcoming games</p>
            )}
          </div>

          {/* Recent Results */}
          {completed.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Recent Results
              </h2>
              <div className="space-y-2">
                {completed.slice(0, 5).map((g) => (
                  <GameCard key={g.id} {...g} />
                ))}
              </div>
            </div>
          )}

          {/* Stat Nugget */}
          {nugget && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Stat of the Day
              </h2>
              <StatNuggetCard {...nugget} />
            </div>
          )}

          {/* Player Stats */}
          {playerMetrics.size > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Key Stats
              </h2>
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
        </div>
      </div>
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
