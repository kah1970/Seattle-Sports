import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const article = await prisma.article.findUnique({
    where: { id: params.id },
    include: {
      team: true,
      source: true,
      tags: true,
      bookmarks: true,
    },
  });

  if (!article) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Increment click count
  await prisma.article.update({
    where: { id: params.id },
    data: { clickCount: { increment: 1 } },
  });

  // Find related articles (same team, recent)
  const related = await prisma.article.findMany({
    where: {
      teamId: article.teamId,
      id: { not: article.id },
    },
    orderBy: { rankScore: "desc" },
    take: 5,
    select: {
      id: true,
      title: true,
      publisher: true,
      publishedAt: true,
      articleType: true,
      analysisDepth: true,
    },
  });

  return NextResponse.json({ article, related });
}
