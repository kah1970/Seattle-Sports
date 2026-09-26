import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArticleDeepDive } from "./article-deep-dive";

export const dynamic = "force-dynamic";

/**
 * Attempt to fetch and parse article content from the original URL.
 * Strips HTML tags and returns plain text up to 5000 chars.
 * Returns null if the URL is not fetchable (timeout, paywall, etc).
 */
async function fetchSourceContent(url: string): Promise<string | null> {
  // Skip placeholder and manual URLs
  if (!url || url.includes("example.com") || url.startsWith("manual://")) return null;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "SeattleSportsIntel/1.0 (Content Preview)" },
      signal: AbortSignal.timeout(8000),
      next: { revalidate: 3600 }, // cache for 1 hour
    });
    if (!res.ok) return null;

    const html = await res.text();

    // Extract text from main article body — try common content selectors via regex
    const articleMatch =
      html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] ||
      html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] ||
      html.match(/<div[^>]*class="[^"]*article[^"]*"[^>]*>([\s\S]*?)<\/div>/i)?.[1] ||
      html;

    // Strip all HTML tags, decode common entities
    const text = articleMatch
      .replace(/<script[\s\S]*?<\/script>/gi, "")
      .replace(/<style[\s\S]*?<\/style>/gi, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/\s{2,}/g, " ")
      .trim();

    if (text.length < 100) return null;
    return text.slice(0, 5000);
  } catch {
    return null;
  }
}

export default async function ArticlePage({
  params,
}: {
  params: { id: string };
}) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      source: true,
      tags: true,
      bookmarks: { where: { userId: "default" } },
    },
  });

  if (!article) notFound();

  // Increment click count
  await prisma.article.update({
    where: { id: params.id },
    data: { clickCount: { increment: 1 } },
  });

  // If content is missing or sparse, try fetching it from the source URL
  let liveContent = article.content;
  const contentIsSparse = !article.content || article.content.length < 200;
  if (contentIsSparse) {
    // Canonical URL strips any #team-slug suffix added for multi-team routing
    const canonicalUrl = article.url.replace(/#team-[a-z]+$/, "");
    const fetched = await fetchSourceContent(canonicalUrl);
    if (fetched) {
      liveContent = fetched;
      // Cache it back to DB so subsequent views don't need to refetch
      await prisma.article.update({
        where: { id: params.id },
        data: { content: fetched },
      }).catch(() => {/* non-critical */ });
    }
  }

  // Find related articles
  const related = await prisma.article.findMany({
    where: {
      teamId: article.teamId,
      id: { not: article.id },
    },
    orderBy: { rankScore: "desc" },
    take: 5,
    include: {
      team: { select: { name: true, slug: true, sport: true } },
    },
  });

  return (
    <ArticleDeepDive
      article={{
        id: article.id,
        title: article.title,
        url: article.url.replace(/#team-[a-z]+$/, ""),  // strip multi-team routing suffix
        publisher: article.publisher,
        publishedAt: article.publishedAt.toISOString(),
        summary: article.summary,
        content: liveContent,
        articleType: article.articleType,
        sport: article.sport,
        analysisDepth: article.analysisDepth,
        isHighlight: article.isHighlight,
        videoUrl: article.videoUrl,
        clickCount: article.clickCount,
        bookmarkCount: article.bookmarkCount,
        team: article.team,
        source: article.source,
        tags: article.tags,
        isBookmarked: article.bookmarks.length > 0,
      }}
      related={related.map((r) => ({
        id: r.id,
        title: r.title,
        publisher: r.publisher,
        publishedAt: r.publishedAt.toISOString(),
        articleType: r.articleType,
        team: r.team,
      }))}
    />
  );
}
