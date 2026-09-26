"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { AlignmentRating } from "./alignment-rating";

interface ArticleCardProps {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  summary?: string | null;
  articleType: string;
  sport: string;
  analysisDepth: number;
  team: { name: string; slug: string };
  isHighlight?: boolean;
  videoUrl?: string | null;
  bookmarkCount?: number;
  alignment?: number | null;
  predictedAlignment?: number | null;
  compact?: boolean;
}

const typeColors: Record<string, string> = {
  news: "badge-news",
  analysis: "badge-analysis",
  opinion: "badge-opinion",
  highlights: "badge-highlights",
  retrospective: "badge-retrospective",
};

const teamAccents: Record<string, string> = {
  mariners: "border-l-teal-600",
  seahawks: "border-l-green-500",
  supersonics: "border-l-yellow-500",
};

export function ArticleCard({
  id,
  title,
  publisher,
  publishedAt,
  summary,
  articleType,
  analysisDepth,
  team,
  isHighlight,
  compact,
  bookmarkCount,
  alignment,
  predictedAlignment,
}: ArticleCardProps) {
  const timeAgo = formatDistanceToNow(new Date(publishedAt), {
    addSuffix: true,
  });
  const depthLabel =
    analysisDepth > 0.7
      ? "Deep"
      : analysisDepth > 0.4
        ? "Standard"
        : "Quick";

  if (compact) {
    return (
      <Link href={`/article/${id}`} className="block group">
        <div
          className={`flex items-start gap-3 py-3 px-3 rounded-lg hover:bg-[var(--card-hover)] transition-colors border-l-2 ${teamAccents[team.slug] || "border-l-gray-600"}`}
        >
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-medium text-gray-200 group-hover:text-white truncate">
              {title}
            </h3>
            <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
              <span>{publisher}</span>
              <span>-</span>
              <span>{timeAgo}</span>
              <span className={`badge ${typeColors[articleType] || "badge-news"}`}>
                {articleType}
              </span>
            </div>
          </div>
          <div className="shrink-0 pt-0.5">
            <AlignmentRating articleId={id} alignment={alignment ?? null} predictedAlignment={predictedAlignment} compact />
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link href={`/article/${id}`} className="block group">
      <div
        className={`card border-l-2 ${teamAccents[team.slug] || "border-l-gray-600"}`}
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={`badge ${typeColors[articleType] || "badge-news"}`}>
              {articleType}
            </span>
            {isHighlight && (
              <span className="badge bg-emerald-500/20 text-emerald-400">
                video
              </span>
            )}
            <span className="text-xs text-gray-500">{depthLabel}</span>
          </div>
          <div className="flex items-center gap-2">
            <AlignmentRating articleId={id} alignment={alignment ?? null} predictedAlignment={predictedAlignment} />
            {bookmarkCount !== undefined && bookmarkCount > 0 && (
              <span className="text-xs text-yellow-500/70">
                {bookmarkCount} saved
              </span>
            )}
          </div>
        </div>

        <h3 className="mt-2 text-base font-semibold text-gray-100 group-hover:text-white line-clamp-2">
          {title}
        </h3>

        {summary && (
          <p className="mt-1.5 text-sm text-gray-400 line-clamp-2">
            {summary}
          </p>
        )}

        <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
          <span className="font-medium text-gray-400">{publisher}</span>
          <span>-</span>
          <time>{timeAgo}</time>
          <span>-</span>
          <span>{team.name}</span>
          <div className="ml-auto">
            <DepthBar depth={analysisDepth} />
          </div>
        </div>
      </div>
    </Link>
  );
}

function DepthBar({ depth }: { depth: number }) {
  const bars = 5;
  const filled = Math.round(depth * bars);
  return (
    <div className="flex items-end gap-px h-3" title={`Analysis depth: ${Math.round(depth * 100)}%`}>
      {Array.from({ length: bars }).map((_, i) => (
        <div
          key={i}
          className={`w-1 rounded-sm ${i < filled ? "bg-purple-500" : "bg-gray-700"
            }`}
          style={{ height: `${((i + 1) / bars) * 100}%` }}
        />
      ))}
    </div>
  );
}
