import { RANKING_WEIGHTS, PUBLISHER_REPUTATION } from "./config";

interface RankableArticle {
  publishedAt: Date;
  publisher: string;
  analysisDepth: number;
  clickCount: number;
  bookmarkCount: number;
}

/**
 * Compute a rank score for an article.
 * @param article - article data
 * @param breakingVsAnalysis - 0 = favor breaking news, 1 = favor deep analysis
 * @returns score between 0 and 1
 */
export function computeRankScore(
  article: RankableArticle,
  breakingVsAnalysis: number = 0.5
): number {
  const recency = computeRecencyScore(article.publishedAt);
  const reputation = computeReputationScore(article.publisher);
  const depth = article.analysisDepth;
  const engagement = computeEngagementScore(
    article.clickCount,
    article.bookmarkCount
  );

  // Adjust weights based on the slider
  const recencyWeight =
    RANKING_WEIGHTS.recency * (1 + (1 - breakingVsAnalysis) * 0.5);
  const depthWeight =
    RANKING_WEIGHTS.analysisDepth * (1 + breakingVsAnalysis * 0.5);

  const totalWeight =
    recencyWeight +
    RANKING_WEIGHTS.reputation +
    depthWeight +
    RANKING_WEIGHTS.engagement;

  const score =
    (recency * recencyWeight +
      reputation * RANKING_WEIGHTS.reputation +
      depth * depthWeight +
      engagement * RANKING_WEIGHTS.engagement) /
    totalWeight;

  return Math.round(score * 1000) / 1000;
}

function computeRecencyScore(publishedAt: Date): number {
  const hoursAgo =
    (Date.now() - publishedAt.getTime()) / (1000 * 60 * 60);
  if (hoursAgo < 1) return 1;
  if (hoursAgo < 6) return 0.9;
  if (hoursAgo < 24) return 0.7;
  if (hoursAgo < 72) return 0.4;
  if (hoursAgo < 168) return 0.2;
  return 0.05;
}

function computeReputationScore(publisher: string): number {
  const rep =
    PUBLISHER_REPUTATION[publisher] || PUBLISHER_REPUTATION["default"];
  return rep / 100;
}

function computeEngagementScore(
  clicks: number,
  bookmarks: number
): number {
  const raw = clicks * 0.3 + bookmarks * 1.0;
  // Normalize: log scale with cap
  if (raw === 0) return 0;
  return Math.min(Math.log10(raw + 1) / 3, 1);
}

/**
 * Compute analysis depth heuristic from article content.
 * Based on: word count, presence of statistical terms, data indicators.
 */
export function computeAnalysisDepth(
  title: string,
  content?: string
): number {
  const text = `${title} ${content || ""}`;
  let score = 0;

  // Word count factor
  const wordCount = text.split(/\s+/).length;
  if (wordCount > 500) score += 0.3;
  else if (wordCount > 200) score += 0.15;
  else score += 0.05;

  // Statistical/analytics keywords
  const analyticsKeywords = [
    "war",
    "era+",
    "fip",
    "wrc+",
    "ops+",
    "babip",
    "statcast",
    "exit velocity",
    "barrel rate",
    "spin rate",
    "epa",
    "dvoa",
    "pff grade",
    "qbr",
    "cpoe",
    "adot",
    "success rate",
    "win probability",
    "leverage",
    "expected",
    "xba",
    "xslg",
    "percentile",
    "above average",
    "standard deviation",
    "regression",
    "projection",
    "model",
  ];

  const lowerText = text.toLowerCase();
  let analyticsHits = 0;
  for (const kw of analyticsKeywords) {
    if (lowerText.includes(kw)) analyticsHits++;
  }
  score += Math.min(analyticsHits * 0.08, 0.5);

  // Presence of numbers (data-heavy articles)
  const numberCount = (text.match(/\d+\.?\d*/g) || []).length;
  if (numberCount > 20) score += 0.2;
  else if (numberCount > 10) score += 0.1;

  return Math.min(Math.round(score * 100) / 100, 1);
}

/**
 * Deduplicate articles by URL hash or title similarity.
 */
export function deduplicateArticles<T extends { url: string; title: string }>(
  articles: T[]
): T[] {
  const seen = new Map<string, T>();

  for (const article of articles) {
    const urlKey = normalizeUrl(article.url);
    if (seen.has(urlKey)) continue;

    // Check title similarity with existing entries
    let isDupe = false;
    for (const existing of Array.from(seen.values())) {
      if (titleSimilarity(article.title, existing.title) > 0.85) {
        isDupe = true;
        break;
      }
    }

    if (!isDupe) {
      seen.set(urlKey, article);
    }
  }

  return Array.from(seen.values());
}

function normalizeUrl(url: string): string {
  try {
    const u = new URL(url);
    // Remove tracking params
    u.searchParams.delete("utm_source");
    u.searchParams.delete("utm_medium");
    u.searchParams.delete("utm_campaign");
    u.searchParams.delete("utm_content");
    u.searchParams.delete("ref");
    return u.toString().replace(/\/$/, "").toLowerCase();
  } catch {
    return url.toLowerCase().replace(/\/$/, "");
  }
}

/**
 * Simple Jaccard-like title similarity (word overlap).
 */
export function titleSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const wordsB = new Set(b.toLowerCase().split(/\s+/).filter(w => w.length > 2));

  if (wordsA.size === 0 || wordsB.size === 0) return 0;

  let intersection = 0;
  Array.from(wordsA).forEach((w) => {
    if (wordsB.has(w)) intersection++;
  });

  const union = new Set(Array.from(wordsA).concat(Array.from(wordsB))).size;
  return union === 0 ? 0 : intersection / union;
}
