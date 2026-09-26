"use client";

import { useState, useEffect, useCallback } from "react";
import { ArticleCard } from "@/components/article-card";

interface SearchResult {
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
  team: { name: string; slug: string; sport: string };
  source: { name: string; reputation: number };
  _count: { bookmarks: number };
}

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [team, setTeam] = useState("");
  const [type, setType] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const search = useCallback(async () => {
    if (!query && !team && !type) {
      setResults([]);
      return;
    }

    setLoading(true);
    const params = new URLSearchParams();
    if (query) params.set("search", query);
    if (team) params.set("team", team);
    if (type) params.set("type", type);
    params.set("limit", "30");

    try {
      const res = await fetch(`/api/articles?${params}`);
      const data = await res.json();
      setResults(data.articles || []);
      setTotal(data.total || 0);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [query, team, type]);

  useEffect(() => {
    const timer = setTimeout(search, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Read initial query from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const q = params.get("q");
    if (q) setQuery(q);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Search</h1>

      <div className="flex flex-wrap gap-3">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles, players, topics..."
          className="flex-1 min-w-[200px] px-4 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-gray-200 placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
        <select
          value={team}
          onChange={(e) => setTeam(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-gray-300"
        >
          <option value="">All Teams</option>
          <option value="mariners">Mariners</option>
          <option value="seahawks">Seahawks</option>
          <option value="supersonics">SuperSonics</option>
        </select>
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          className="px-3 py-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-gray-300"
        >
          <option value="">All Types</option>
          <option value="news">News</option>
          <option value="analysis">Analysis</option>
          <option value="opinion">Opinion</option>
          <option value="highlights">Highlights</option>
          <option value="retrospective">Retrospective</option>
        </select>
      </div>

      {loading && <p className="text-sm text-gray-500">Searching...</p>}

      {!loading && results.length > 0 && (
        <p className="text-sm text-gray-500">{total} results</p>
      )}

      <div className="space-y-3">
        {results.map((article) => (
          <ArticleCard
            key={article.id}
            {...article}
            bookmarkCount={article._count?.bookmarks || 0}
          />
        ))}
      </div>

      {!loading && query && results.length === 0 && (
        <p className="text-sm text-gray-500 py-8 text-center">
          No results found for &quot;{query}&quot;
        </p>
      )}
    </div>
  );
}
