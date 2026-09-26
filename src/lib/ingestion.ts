import { prisma } from "./db";
import { createAdapterRegistry } from "./sources";
import { computeRankScore, computeAnalysisDepth, deduplicateArticles } from "./ranking";
import { ArticleItem, GameInfo } from "./types";
import { createHash } from "crypto";
import { predictAlignment } from "./alignment-predictor";

/**
 * Main ingestion pipeline: fetches from all enabled source adapters **in parallel**,
 * deduplicates, computes scores, and stores in database.
 *
 * Per-source TTL: if a source's lastFetchAt is within its minFetchIntervalMinutes
 * it will be skipped to avoid hammering feeds on fast cron cycles.
 */
export async function runIngestion(): Promise<{
  articlesProcessed: number;
  gamesProcessed: number;
  skippedSources: string[];
  errors: string[];
}> {
  const registry = createAdapterRegistry();
  const errors: string[] = [];
  const skippedSources: string[] = [];
  let articlesProcessed = 0;
  let gamesProcessed = 0;

  // Load last-fetch times for all sources in one query
  const sourceRecords = await prisma.source.findMany({
    select: { name: true, lastFetchAt: true },
  });
  const lastFetchMap = new Map(
    sourceRecords.map((s) => [s.name, s.lastFetchAt])
  );

  // ── Parallel fetch of all news adapters ───────────────────────────────────
  const newsResults = await Promise.allSettled(
    registry.news.map(async (adapter) => {
      // TTL check: skip if fetched recently
      const lastFetch = lastFetchMap.get(adapter.name);
      const ttlMinutes = (adapter as { minFetchIntervalMinutes?: number }).minFetchIntervalMinutes ?? 30;
      if (lastFetch) {
        const minutesSince = (Date.now() - lastFetch.getTime()) / 60_000;
        if (minutesSince < ttlMinutes) {
          skippedSources.push(adapter.name);
          return { adapter, items: [] as ArticleItem[], skipped: true };
        }
      }

      const items = await adapter.fetch();
      await updateSourceStatus(adapter.name, true);
      return { adapter, items, skipped: false };
    })
  );

  // Collect items and handle per-adapter errors
  const allArticles: ArticleItem[] = [];
  for (const result of newsResults) {
    if (result.status === "fulfilled") {
      if (!result.value.skipped) {
        allArticles.push(...result.value.items);
      }
    } else {
      // result.reason is the thrown error
      const adapterIndex = newsResults.indexOf(result);
      const adapterName = registry.news[adapterIndex]?.name ?? "unknown";
      const msg = `[${adapterName}] ${result.reason instanceof Error ? result.reason.message : "Unknown error"}`;
      errors.push(msg);
      console.error(msg);
      await updateSourceStatus(adapterName, false, msg);
    }
  }

  // Deduplicate across all sources
  const unique = deduplicateArticles(allArticles);

  // Store articles
  for (const item of unique) {
    try {
      const stored = await storeArticle(item);
      if (stored) articlesProcessed++;
    } catch (err) {
      if (
        err instanceof Error &&
        err.message.includes("Unique constraint")
      ) {
        continue; // already exists — normal
      }
      errors.push(
        `Store error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  // ── Parallel fetch of score adapters ──────────────────────────────────────
  const scoreResults = await Promise.allSettled(
    registry.scores.map((adapter) => adapter.fetchScores?.() ?? Promise.resolve([]))
  );

  for (let i = 0; i < scoreResults.length; i++) {
    const result = scoreResults[i];
    if (result.status === "fulfilled" && result.value) {
      for (const game of result.value) {
        await storeGame(game);
        gamesProcessed++;
      }
    } else if (result.status === "rejected") {
      errors.push(
        `[${registry.scores[i]?.name}] Scores: ${result.reason instanceof Error ? result.reason.message : "Unknown"}`
      );
    }
  }

  return { articlesProcessed, gamesProcessed, skippedSources, errors };
}

async function storeArticle(item: ArticleItem): Promise<boolean> {
  // For multi-team duplicates the URL has #team-<slug> appended — hash that full string
  const urlHash = createHash("sha256").update(item.url).digest("hex");

  const existing = await prisma.article.findUnique({ where: { urlHash } });
  if (existing) return false;

  const team = await prisma.team.findUnique({ where: { slug: item.teamSlug } });
  if (!team) return false;

  let source = await prisma.source.findFirst({ where: { name: item.publisher } });
  if (!source) {
    source = await prisma.source.create({
      data: {
        name: item.publisher,
        slug: item.publisher.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: item.publisher === "Manual Input" ? "manual" : "rss",
        reputation: 50,
      },
    });
  }

  const analysisDepth = computeAnalysisDepth(item.title, item.content || item.summary);
  const rankScore = computeRankScore({
    publishedAt: item.publishedAt,
    publisher: item.publisher,
    analysisDepth,
    clickCount: 0,
    bookmarkCount: 0,
  });

  await prisma.article.create({
    data: {
      title: item.title,
      url: item.url,
      urlHash,
      publisher: item.publisher,
      publishedAt: item.publishedAt,
      summary: item.summary,
      content: item.content,
      imageUrl: item.imageUrl,
      analysisDepth,
      articleType: item.articleType,
      sport: item.sport,
      isHighlight: item.isHighlight,
      videoUrl: item.videoUrl,
      rankScore,
      predictedAlignment: predictAlignment(item.title, item.summary, item.teamSlug),
      teamId: team.id,
      sourceId: source.id,
      tags: item.tags
        ? {
          connectOrCreate: item.tags.map((tag) => ({
            where: { slug: tag.toLowerCase().replace(/\s+/g, "-") },
            create: {
              name: tag,
              slug: tag.toLowerCase().replace(/\s+/g, "-"),
            },
          })),
        }
        : undefined,
    },
  });

  return true;
}

async function storeGame(game: GameInfo): Promise<void> {
  if (!game.externalId) return;

  await prisma.gameSchedule.upsert({
    where: { externalId: game.externalId },
    update: {
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      summary: game.summary,
    },
    create: {
      sport: game.sport,
      teamSlug: game.teamSlug,
      opponent: game.opponent,
      gameDate: game.gameDate,
      isHome: game.isHome,
      venue: game.venue,
      status: game.status,
      homeScore: game.homeScore,
      awayScore: game.awayScore,
      summary: game.summary,
      externalId: game.externalId,
    },
  });
}

/**
 * Public wrapper for manual article storage (used by /api/articles/manual).
 */
export async function storeManualArticle(item: ArticleItem): Promise<boolean> {
  return storeArticle(item);
}

async function updateSourceStatus(
  name: string,
  success: boolean,
  error?: string
): Promise<void> {
  try {
    const source = await prisma.source.findFirst({ where: { name } });
    if (!source) return;

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchAt: new Date(),
        lastError: success ? null : error,
        fetchCount: { increment: 1 },
        errorCount: success ? source.errorCount : { increment: 1 },
      },
    });
  } catch {
    console.warn(`Could not update source status for ${name}`);
  }
}
