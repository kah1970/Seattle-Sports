"use client";

import { useState } from "react";
import { ArticleCard } from "@/components/article-card";
import { GameCard } from "@/components/game-card";
import { StatNuggetCard } from "@/components/stat-nugget-card";
import { RankingSlider } from "@/components/ranking-slider";
import { StatNuggetData } from "@/lib/types";

type TabKey = "all" | "mariners" | "seahawks" | "supersonics";

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

export function DashboardClient({ data }: { data: DashboardData }) {
  const [activeTab, setActiveTab] = useState<TabKey>("all");
  const [slider, setSlider] = useState(0.5);

  const filteredArticles = data.articles.filter((a) => {
    if (activeTab === "all") return true;
    return a.team.slug === activeTab;
  });

  const filteredGames = data.games.filter((g) => {
    if (activeTab === "all") return true;
    return g.teamSlug === activeTab;
  });

  const filteredNuggets = data.nuggets.filter((n) => {
    if (activeTab === "all") return true;
    return n.teamSlug === activeTab;
  });

  // Sort articles by adjusted rank based on slider
  const sorted = [...filteredArticles].sort((a, b) => {
    const aScore =
      a.rankScore * (1 - slider) + a.analysisDepth * slider;
    const bScore =
      b.rankScore * (1 - slider) + b.analysisDepth * slider;
    return bScore - aScore;
  });

  const topStories = sorted.slice(0, 4);
  const latest = sorted.slice(4, 15);
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
        <RankingSlider value={slider} onChange={setSlider} />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-[var(--border)] pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-t-md transition-colors ${
              activeTab === tab.key
                ? "bg-[var(--card)] text-white border-b-2 border-blue-500"
                : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
            }`}
          >
            {tab.label}
          </button>
        ))}
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
        {latest.length === 0 && (
          <p className="text-sm text-gray-500 py-4">
            No articles found. Try refreshing sources via /api/cron/refresh.
          </p>
        )}
      </div>
    </div>
  );
}
