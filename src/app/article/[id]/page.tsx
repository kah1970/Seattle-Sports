import { prisma } from "@/lib/db";
import { notFound } from "next/navigation";
import { ArticleDeepDive } from "./article-deep-dive";

export const dynamic = "force-dynamic";

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
        url: article.url,
        publisher: article.publisher,
        publishedAt: article.publishedAt.toISOString(),
        summary: article.summary,
        content: article.content,
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
