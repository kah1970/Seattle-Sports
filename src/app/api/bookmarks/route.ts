import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET() {
  const bookmarks = await prisma.bookmark.findMany({
    where: { userId: "default" },
    orderBy: { createdAt: "desc" },
    include: {
      article: {
        include: {
          team: { select: { name: true, slug: true, sport: true } },
          source: { select: { name: true } },
        },
      },
    },
  });

  return NextResponse.json({ bookmarks });
}

export async function POST(request: Request) {
  const body = await request.json();
  const { articleId, note } = body;

  if (!articleId) {
    return NextResponse.json(
      { error: "articleId is required" },
      { status: 400 }
    );
  }

  // Toggle bookmark
  const existing = await prisma.bookmark.findUnique({
    where: {
      articleId_userId: { articleId, userId: "default" },
    },
  });

  if (existing) {
    await prisma.bookmark.delete({ where: { id: existing.id } });
    await prisma.article.update({
      where: { id: articleId },
      data: { bookmarkCount: { decrement: 1 } },
    });
    return NextResponse.json({ bookmarked: false });
  }

  await prisma.bookmark.create({
    data: { articleId, userId: "default", note },
  });
  await prisma.article.update({
    where: { id: articleId },
    data: { bookmarkCount: { increment: 1 } },
  });

  return NextResponse.json({ bookmarked: true });
}
