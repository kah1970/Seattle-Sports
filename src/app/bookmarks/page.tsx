import { prisma } from "@/lib/db";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { BookmarkButton } from "@/components/bookmark-button";

export const dynamic = "force-dynamic";

export default async function BookmarksPage() {
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Bookmarks</h1>
        <span className="text-sm text-gray-500">{bookmarks.length} saved</span>
      </div>

      {bookmarks.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No bookmarks yet.</p>
          <p className="text-sm text-gray-600 mt-1">
            Bookmark articles to save them for later.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {bookmarks.map((bm) => (
          <div
            key={bm.id}
            className="card flex items-start justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <Link
                href={`/article/${bm.article.id}`}
                className="text-sm font-medium text-gray-200 hover:text-white transition-colors line-clamp-2"
              >
                {bm.article.title}
              </Link>
              <div className="flex items-center gap-2 mt-1 text-xs text-gray-500">
                <span>{bm.article.source.name}</span>
                <span>-</span>
                <span>{bm.article.team.name}</span>
                <span>-</span>
                <span>
                  {formatDistanceToNow(bm.article.publishedAt, {
                    addSuffix: true,
                  })}
                </span>
              </div>
              {bm.note && (
                <p className="text-xs text-gray-400 mt-1">{bm.note}</p>
              )}
            </div>
            <BookmarkButton articleId={bm.article.id} isBookmarked={true} />
          </div>
        ))}
      </div>
    </div>
  );
}
