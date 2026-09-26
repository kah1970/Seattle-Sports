"use client";

import { useState, useCallback } from "react";
import { ArticleCard } from "@/components/article-card";
import { TeamStatusStrip } from "@/components/team-status-strip";
import type { TeamStatus } from "@/lib/team-status";
import { StatNuggetCard } from "@/components/stat-nugget-card";
import { StatNuggetData } from "@/lib/types";

type TabKey = "all" | "mariners" | "seahawks" | "supersonics" | "cougars";
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
  teams: TeamStatus[];
  nuggets: StatNuggetData[];
  today: string;
}

const tabs: { key: TabKey; label: string }[] = [
  { key: "all", label: "All Seattle" },
  { key: "mariners", label: "Mariners" },
  { key: "seahawks", label: "Seahawks" },
  { key: "supersonics", label: "SuperSonics" },
  { key: "cougars", label: "Cougars" },
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

  const filteredNuggets = data.nuggets.filter((n) => {
    if (activeTab === "all") return true;
    return n.teamSlug === activeTab;
  });

  const topStories = filteredArticles.slice(0, 5);
  const latest = filteredArticles.slice(5, 16);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold">Seattle Sports</h1>
          <p className="text-sm text-gray-500 mt-1">{data.today}</p>
        </div>
      </div>

      {/* Scoreboard: every team's record, status and next game */}
      <TeamStatusStrip teams={data.teams} />

      {/* Team Tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-[var(--border)] pb-px">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-2 text-sm font-medium whitespace-nowrap rounded-t-md transition-colors ${activeTab === tab.key
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
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-xs text-gray-500 mr-2 shrink-0">Show:</span>
          {timeWindows.map((tw) => (
            <button
              key={tw.key}
              onClick={() => setTimeWindow(tw.key)}
              className={`px-3 py-1 text-xs font-medium whitespace-nowrap rounded-full transition-colors ${timeWindow === tw.key
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Top Stories: the lead story runs full width */}
        <div className="lg:col-span-2">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Top Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {topStories.map((article, i) => (
              <div key={article.id} className={i === 0 ? "md:col-span-2" : undefined}>
                <ArticleCard {...article} bookmarkCount={article.bookmarkCount} />
              </div>
            ))}
          </div>
        </div>

        {/* Stat Nuggets */}
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            Stat of the Day
          </h2>
          {filteredNuggets.map((nugget) => (
            <StatNuggetCard key={nugget.teamSlug} {...nugget} />
          ))}
        </div>
      </div>

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
