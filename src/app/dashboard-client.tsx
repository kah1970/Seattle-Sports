"use client";

import { useState, useCallback } from "react";
import { ArticleCard } from "@/components/article-card";
import { GameCard } from "@/components/game-card";
import { StatNuggetCard } from "@/components/stat-nugget-card";
import { StatNuggetData } from "@/lib/types";

type TabKey = "all" | "mariners" | "seahawks" | "supersonics";
type TimeWindow = "week" | "month" | "year" | "all";
type AlignmentFilter = "all" | "aligned" | "unrated";

interface DashboardData {
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
  nuggets: StatNuggetData[];
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Seattle" },
  { key: "mariners", label: "Mariners" },
  { key: "seahawks", label: "Seahawks" },
  { key: "supersonics", label: "SuperSonics" },
];

const timeWindows: { key: TimeWindow; label: string }[] = [
  { key: "week", label: "This Week" },
  { key: "month", label: "This Month" },
  { key: "year", label: "This Year" },
  { key: "all", label: "All Time" },
];

/** Returns a Date cutoff for the given time window (null = no filter) */
function getWindowCutoff(window: TimeWindow): Date | null {
  const now = new Date();
  switch (window) {
    case "week": return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    case "month": return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    case "year": return new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
    case "all": return null;
  }
}

export function DashboardClient({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [timeWindow, setTimeWindow] = useState<TimeWindow>("week");
  const [alignmentFilter, setAlignmentFilter] = useState<AlignmentFilter>("all");

  const cutoff = getWindowCutoff(timeWindow);

  const expandToNext = useCallback(() => {
    const order: TimeWindow[] = ["week", "month", "year", "all"];
    const idx = order.indexOf(timeWindow);
    if (idx < order.length - 1) setTimeWindow(order[idx + 1]);
  }, [timeWindow]);

  const filteredArticles = data.articles.filter((a) => {
    if (activeTab !== "all" && a.team.slug !== activeTab) return false;
    if (cutoff) {
      const published = new Date(a.publishedAt);
      if (published < cutoff) return false;
    }
    if (alignmentFilter === "aligned") {
      const score = a.alignment ?? a.predictedAlignment;
      if (score !== null && score !== undefined && score < 2) return false;
    } else if (alignmentFilter === "unrated") {
      if (a.alignment !== null && a.alignment !== undefined) return false;
    }
    return true;
  });

  const filteredGames = data.games.filter((g) => {
    if (activeTab === "all") return true;
    return g.teamSlug === activeTab;
  });

  const filteredNuggets = data.nuggets.filter((n) => {
    if (activeTab === "all") return true;
    return n.teamSlug === activeTab;
  });

  const topStories = filteredArticles.slice(0, 4);
  const latest = filteredArticles.slice(4, 15);
  const nextGame = filteredGames.find((g) => g.status === "scheduled");
  const recentResults = filteredGames.filter((g) => g.status === "final");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seattle Sports Intel</h1>
          <p className="text-sm text-gray-500 mt-1">
            News, scores, and analytics for Seattle sports
          </p>
        </div>
      </div>

      {/* Team Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${activeTab === tab.key
              ? "bg-[var(--card)] text-white border-b-2 border-blue-500"
              : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
              }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Time-window + Alignment filters */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2 shrink-0">Show:</span>
          {timeWindows.map((tw) => (
            <button
              key={tw.key}
              onClick={() => setTimeWindow(tw.key)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${timeWindow === tw.key
                ? "bg-blue-600 text-white"
                : "bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                }`}
            >
              {tw.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-gray-500 mr-2 shrink-0">Alignment:</span>
          {(["all", "aligned", "unrated"] as AlignmentFilter[]).map((f) => (
            <button
              key={f}
              onClick={() => setAlignmentFilter(f)}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${alignmentFilter === f
                ? "bg-green-600 text-white"
                : "bg-white/5 text-gray-400 hover:text-gray-200 hover:bg-white/10"
                }`}
            >
              {f === "all" ? "All" : f === "aligned" ? "Aligned (2-3)" : "Unrated"}
            </button>
          ))}
        </div>
      </div>

      {/* Games & Next Game */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Next Game / What to Watch */}
        <div className="lg:col-span-1 space-y-4">
          <div className="card">
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
              What to Watch
            </h2>
            {nextGame ? (
              <GameCard {...nextGame} />
            ) : (
              <p className="text-sm text-gray-500">
                No upcoming games scheduled
              </p>
            )}
          </div>

          {/* Stat Nuggets */}
          {filteredNuggets.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
                Stat Nugget
              </h2>
              {filteredNuggets.slice(0, 2).map((nugget, i) => (
                <div key={i} className="mb-3">
                  <StatNuggetCard {...nugget} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Stories */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topStories.map((article) => (
              <ArticleCard
                key={article.id}
                {...article}
                bookmarkCount={article.bookmarkCount}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Recent Scores */}
      {recentResults.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Recent Results
          </h2>
          <div className="flex gap-3 overflow-x-auto pb-2">
            {recentResults.map((game) => (
              <GameCard key={game.id} {...game} />
            ))}
          </div>
        </div>
      )}

      {/* Latest Feed */}
      <div>
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
          Latest
        </h2>
        <div className="space-y-1">
          {latest.map((article) => (
            <ArticleCard key={article.id} {...article} compact />
          ))}
        </div>
        {filteredArticles.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400 mb-2">
              No articles found for <strong>{timeWindows.find(t => t.key === timeWindow)?.label}</strong>.
            </p>
            {timeWindow !== "all" && (
              <button
                onClick={expandToNext}
                className="text-sm text-blue-400 hover:text-blue-300 underline"
              >
                Expand to next time range →
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
