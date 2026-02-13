import { prisma } from "./db";
import { createAdapterRegistry } from "./sources";
import { computeRankScore, computeAnalysisDepth, deduplicateArticles } from "./ranking";
import { ArticleItem, GameInfo } from "./types";
import { createHash } from "crypto";

/**
 * Main ingestion pipeline: fetches from all enabled source adapters,
 * deduplicates, computes scores, and stores in database.
 */
export async function runIngestion(): Promise<{
  articlesProcessed: number;
  gamesProcessed: number;
  errors: string[];
}> {
  const registry = createAdapterRegistry();
  const errors: string[] = [];
  let articlesProcessed = 0;
  let gamesProcessed = 0;

  // Fetch articles from all news adapters
  const allArticles: ArticleItem[] = [];
  for (const adapter of registry.news) {
    try {
      const items = await adapter.fetch();
      allArticles.push(...items);

      // Update source status
      await updateSourceStatus(adapter.name, true);
    } catch (err) {
      const msg = `[${adapter.name}] ${err instanceof Error ? err.message : "Unknown error"}`;
      errors.push(msg);
      console.error(msg);
      await updateSourceStatus(adapter.name, false, msg);
    }
  }

  // Deduplicate
  const unique = deduplicateArticles(allArticles);

  // Store articles
  for (const item of unique) {
    try {
      const stored = await storeArticle(item);
      if (stored) articlesProcessed++;
    } catch (err) {
      // Skip duplicates (unique constraint violations)
      if (
        err instanceof Error &&
        err.message.includes("Unique constraint")
      ) {
        continue;
      }
      errors.push(
        `Store error: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  // Fetch scores from score adapters
  for (const adapter of registry.scores) {
    try {
      const games = await adapter.fetchScores?.();
      if (games) {
        for (const game of games) {
          await storeGame(game);
          gamesProcessed++;
        }
      }
    } catch (err) {
      errors.push(
        `[${adapter.name}] Scores: ${err instanceof Error ? err.message : "Unknown"}`
      );
    }
  }

  return { articlesProcessed, gamesProcessed, errors };
}

async function storeArticle(item: ArticleItem): Promise<boolean> {
  const urlHash = createHash("sha256").update(item.url).digest("hex");

  // Check for existing
  const existing = await prisma.article.findUnique({
    where: { urlHash },
  });
  if (existing) return false;

  // Resolve team
  const team = await prisma.team.findUnique({
    where: { slug: item.teamSlug },
  });
  if (!team) return false;

  // Resolve source
  let source = await prisma.source.findFirst({
    where: { name: item.publisher },
  });
  if (!source) {
    source = await prisma.source.create({
      data: {
        name: item.publisher,
        slug: item.publisher.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
        type: "rss",
        reputation: 50,
      },
    });
  }

  const analysisDepth = computeAnalysisDepth(
    item.title,
    item.content || item.summary
  );
  const rankScore = computeRankScore({
    publishedAt: item.publishedAt,
    publisher: item.publisher,
    analysisDepth,
    clickCount: 0,
    bookmarkCount: 0,
  });

  // Create article
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
    // Non-critical, just log
    console.warn(`Could not update source status for ${name}`);
  }
}
