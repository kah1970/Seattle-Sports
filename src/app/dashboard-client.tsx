"use client";

import { useState, useCallback } from "react";
import { ArticleCard } from "@/components/article-card";
import { TeamStatusStrip } from "@/components/team-status-strip";
import { SectionHeader } from "@/components/section-header";
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
    <div className="space-y-8">
      {/* Masthead */}
      <header className="pt-2">
        <p className="eyebrow">{data.today}</p>
        <h1 className="mt-2 text-4xl font-semibold tracking-tight text-white sm:text-5xl">
          Seattle Sports
        </h1>
        <p className="mt-2 max-w-xl text-[15px] text-gray-400">
          Scores, standings and the stories behind them, for every team in town.
        </p>
      </header>

      {/* Scoreboard: every team's record, status and next game */}
      <TeamStatusStrip teams={data.teams} />

      {/* Team tabs + filters */}
      <div className="flex flex-col gap-3 border-y border-[var(--border)] py-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="-mx-1 flex gap-1 overflow-x-auto px-1 [scrollbar-width:none]" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-white/[0.08] text-white"
                  : "text-gray-400 hover:bg-white/5 hover:text-gray-200"
              }`}
            >
              {tab.key !== "all" && (
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: `var(--team-${tab.key})` }}
                  aria-hidden="true"
                />
              )}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex flex-wrap items-center gap-1">
            {timeWindows.map((tw) => (
              <button
                key={tw.key}
                onClick={() => setTimeWindow(tw.key)}
                className={`chip ${timeWindow === tw.key ? "chip-active" : ""}`}
              >
                {tw.label}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-1">
            <span className="mr-1 text-xs text-gray-500">Alignment</span>
            {(["all", "aligned", "unrated"] as AlignmentFilter[]).map((f) => (
              <button
                key={f}
                onClick={() => setAlignmentFilter(f)}
                className={`chip ${alignmentFilter === f ? "chip-active" : ""}`}
              >
                {f === "all" ? "All" : f === "aligned" ? "Aligned (2-3)" : "Unrated"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Top Stories: the lead story runs full width */}
        <div className="lg:col-span-2">
          <SectionHeader title="Top Stories" />
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
          <SectionHeader title="Stat of the Day" />
          {filteredNuggets.map((nugget) => (
            <StatNuggetCard key={nugget.teamSlug} {...nugget} />
          ))}
        </div>
      </div>

      {/* Latest Feed */}
      <div>
        <SectionHeader title="Latest" />
        {latest.length > 0 && (
          <div className="card divide-y divide-white/[0.05] p-1.5">
            {latest.map((article) => (
              <ArticleCard key={article.id} {...article} compact />
            ))}
          </div>
        )}
        {filteredArticles.length === 0 && (
          <div className="py-6 text-center">
            <p className="text-sm text-gray-400 mb-2">
              No articles found for <strong>{timeWindows.find(t => t.key === timeWindow)?.label}</strong>.
            </p>
            {timeWindow !== "all" && (
              <button
                onClick={expandToNext}
                className="text-sm text-[var(--accent)] hover:text-[var(--accent-strong)] underline"
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
