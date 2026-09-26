"use client";

import Link from "next/link";
import { formatDistanceToNow, format } from "date-fns";
import { BookmarkButton } from "@/components/bookmark-button";

interface ArticleData {
  id: string;
  title: string;
  url: string;
  publisher: string;
  publishedAt: string;
  summary: string | null;
  content: string | null;
  articleType: string;
  sport: string;
  analysisDepth: number;
  isHighlight: boolean;
  videoUrl: string | null;
  clickCount: number;
  bookmarkCount: number;
  isBookmarked: boolean;
  team: { name: string; slug: string; sport: string };
  source: { name: string; reputation: number };
  tags: { name: string; slug: string }[];
}

interface RelatedArticle {
  id: string;
  title: string;
  publisher: string;
  publishedAt: string;
  articleType: string;
  team: { name: string; slug: string };
}

const typeLabels: Record<string, string> = {
  news: "Breaking News",
  analysis: "Deep Analysis",
  opinion: "Opinion",
  highlights: "Highlights",
  retrospective: "Retrospective",
  "spring-training": "Spring Training",
  "roster-move": "Roster Move",
  prospects: "Prospects",
};

function generateWhyThisMatters(article: ArticleData): string[] {
  const bullets: string[] = [];
  const title = article.title.toLowerCase();

  if (article.team.slug === "supersonics") {
    if (title.includes("expansion")) {
      bullets.push(
        "NBA expansion could bring basketball back to Seattle for the first time since 2008."
      );
      bullets.push(
        "Climate Pledge Arena is already built to NBA specifications."
      );
    }
    if (title.includes("legacy") || title.includes("history") || title.includes("championship")) {
      bullets.push(
        "The SuperSonics won the 1979 NBA Championship, their only title."
      );
    }
  }

  if (article.team.slug === "mariners") {
    if (title.includes("pitching") || title.includes("rotation")) {
      bullets.push(
        "Seattle's pitching-first strategy has been the foundation of their competitive window."
      );
    }
    if (title.includes("julio")) {
      bullets.push(
        "Julio Rodriguez is signed long-term and is central to the Mariners' offensive development."
      );
    }
  }

  if (article.team.slug === "seahawks") {
    if (title.includes("defense") || title.includes("witherspoon")) {
      bullets.push(
        "Devon Witherspoon's 91.2 PFF grade in 2025 was the best by a Seahawks corner since Richard Sherman."
      );
    }
    if (title.includes("smith-njigba") || title.includes("jsn") || title.includes("receiver")) {
      bullets.push(
        "JSN's 1,793 receiving yards in 2025 led the NFL and earned him Offensive Player of the Year."
      );
    }
    if (title.includes("darnold") || title.includes("quarterback") || title.includes("super bowl")) {
      bullets.push(
        "Sam Darnold led Seattle to Super Bowl LX in 2025, completing one of the greatest single-season QB turnarounds in NFL history."
      );
    }
    if (title.includes("walker") || title.includes("run") || title.includes("rush")) {
      bullets.push(
        "Kenneth Walker III enters 2026 healthy after an injury-shortened 2025 — the Seahawks' ground game is a key part of their Super Bowl defense."
      );
    }
  }

  if (article.analysisDepth > 0.6) {
    bullets.push(
      "This article includes advanced statistical analysis worth diving into."
    );
  }

  if (bullets.length === 0) {
    bullets.push(
      `Key ${article.sport} coverage from ${article.publisher} for ${article.team.name} fans.`
    );
  }

  return bullets;
}
/** Strip dangerous/noisy elements while keeping readable prose HTML */
function sanitizeHtml(html: string): string {
  return html
    // Remove iframes, scripts, style blocks, figures, video (use [\s\S] instead of . with s flag)
    .replace(/<iframe[^>]*>[\s\S]*?<\/iframe>/gi, "")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<figure[^>]*>[\s\S]*?<\/figure>/gi, "")
    .replace(/<video[^>]*>[\s\S]*?<\/video>/gi, "")
    // Strip class/id/data-* attributes
    .replace(/\s(class|id|data-[a-z-]+)="[^"]*"/gi, "")
    // Remove empty paragraphs
    .replace(/<p>\s*<\/p>/gi, "")
    .trim();
}

export function ArticleDeepDive({
  article,
  related,
}: {
  article: ArticleData;
  related: RelatedArticle[];
}) {
  const whyMatters = generateWhyThisMatters(article);
  const timeAgo = formatDistanceToNow(new Date(article.publishedAt), {
    addSuffix: true,
  });

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Back */}
      <Link
        href={`/team/${article.team.slug}`}
        className="text-sm text-gray-500 hover:text-gray-300 transition-colors"
      >
        Back to {article.team.name}
      </Link>

      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`badge badge-${article.articleType}`}
          >
            {typeLabels[article.articleType] || article.articleType}
          </span>
          <span className="text-xs text-gray-500">{article.sport}</span>
          {article.isHighlight && (
            <span className="badge bg-emerald-500/20 text-emerald-400">
              Video
            </span>
          )}
        </div>

        <h1 className="text-2xl font-bold leading-tight">{article.title}</h1>

        <div className="flex items-center gap-4 text-sm text-gray-400">
          <span className="font-medium">{article.publisher}</span>
          <time title={format(new Date(article.publishedAt), "PPpp")}>
            {timeAgo}
          </time>
          <span className="text-gray-600">
            Depth: {Math.round(article.analysisDepth * 100)}%
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <BookmarkButton
          articleId={article.id}
          isBookmarked={article.isBookmarked}
        />
        <a
          href={article.url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          Read Original
        </a>
      </div>

      {/* Video Embed */}
      {article.videoUrl && article.videoUrl.includes("youtube.com") && (
        <div className="aspect-video rounded-lg overflow-hidden bg-black">
          <iframe
            src={article.videoUrl.replace("watch?v=", "embed/")}
            className="w-full h-full"
            allowFullScreen
            title={article.title}
          />
        </div>
      )}

      {/* Summary */}
      {article.summary && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
            Summary
          </h2>
          <p className="text-gray-300 leading-relaxed">{article.summary}</p>
        </div>
      )}

      {/* Content */}
      {article.content && article.content !== article.summary && (
        <div className="card">
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Story Content
          </h2>
          {article.content.includes("<") ? (
            <div
              className="prose-article"
              dangerouslySetInnerHTML={{ __html: sanitizeHtml(article.content) }}
            />
          ) : (
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line">
              {article.content}
            </p>
          )}
        </div>
      )}

      {/* Why This Matters */}
      <div className="card border-l-2 border-l-blue-500">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Why This Matters
        </h2>
        <ul className="space-y-2">
          {whyMatters.map((bullet, i) => (
            <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-blue-400 mt-0.5 shrink-0">-</span>
              {bullet}
            </li>
          ))}
        </ul>
      </div>

      {/* Attribution */}
      <div className="card bg-[var(--background)] border-dashed">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Attribution
        </h2>
        <div className="text-sm text-gray-400 space-y-1">
          <p>
            Publisher: <span className="text-gray-300">{article.publisher}</span>
          </p>
          <p>
            Source reputation:{" "}
            <span className="text-gray-300">{article.source.reputation}/100</span>
          </p>
          <p>
            Published:{" "}
            <span className="text-gray-300">
              {format(new Date(article.publishedAt), "PPpp")}
            </span>
          </p>
          <p>
            Original:{" "}
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline break-all"
            >
              {article.url}
            </a>
          </p>
        </div>
      </div>

      {/* Tags */}
      {article.tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {article.tags.map((tag) => (
            <Link
              key={tag.slug}
              href={`/search?q=${tag.name}`}
              className="px-2 py-1 rounded bg-white/5 text-xs text-gray-400 hover:bg-white/10 hover:text-gray-200 transition-colors"
            >
              {tag.name}
            </Link>
          ))}
        </div>
      )}

      {/* Related */}
      {related.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Related
          </h2>
          <div className="space-y-2">
            {related.map((r) => (
              <Link
                key={r.id}
                href={`/article/${r.id}`}
                className="block group"
              >
                <div className="py-2 px-3 rounded-lg hover:bg-[var(--card-hover)] transition-colors">
                  <h3 className="text-sm text-gray-300 group-hover:text-white">
                    {r.title}
                  </h3>
                  <div className="text-xs text-gray-500 mt-1">
                    {r.publisher} -{" "}
                    {formatDistanceToNow(new Date(r.publishedAt), {
                      addSuffix: true,
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
