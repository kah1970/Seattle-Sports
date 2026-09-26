import { prisma } from "@/lib/db";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [sources, articleCount, gameCount, metricCount, bookmarkCount] =
    await Promise.all([
      prisma.source.findMany({
        orderBy: { name: "asc" },
        include: { _count: { select: { articles: true } } },
      }),
      prisma.article.count(),
      prisma.gameSchedule.count(),
      prisma.metric.count(),
      prisma.bookmark.count(),
    ]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <Link
          href="/admin/import"
          className="px-3 py-1.5 rounded-md text-sm font-medium bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 transition-colors"
        >
          Import Data
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Articles", value: articleCount },
          { label: "Games", value: gameCount },
          { label: "Metrics", value: metricCount },
          { label: "Bookmarks", value: bookmarkCount },
        ].map((s) => (
          <div key={s.label} className="card text-center">
            <div className="text-2xl font-bold font-mono text-gray-200">
              {s.value}
            </div>
            <div className="text-xs text-gray-500 uppercase tracking-wider">
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* Source Health */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Source Health</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b border-[var(--border)]">
                <th className="py-2 px-3">Source</th>
                <th className="py-2 px-3">Type</th>
                <th className="py-2 px-3">Reputation</th>
                <th className="py-2 px-3">Articles</th>
                <th className="py-2 px-3">Fetches</th>
                <th className="py-2 px-3">Errors</th>
                <th className="py-2 px-3">Status</th>
                <th className="py-2 px-3">Last Fetch</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((src) => (
                <tr
                  key={src.id}
                  className="border-b border-[var(--border)] hover:bg-[var(--card-hover)]"
                >
                  <td className="py-2 px-3 font-medium text-gray-200">
                    {src.name}
                  </td>
                  <td className="py-2 px-3 text-gray-400">{src.type}</td>
                  <td className="py-2 px-3">
                    <span
                      className={`font-mono ${
                        src.reputation >= 80
                          ? "text-green-400"
                          : src.reputation >= 60
                            ? "text-yellow-400"
                            : "text-red-400"
                      }`}
                    >
                      {src.reputation}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-gray-400 font-mono">
                    {src._count.articles}
                  </td>
                  <td className="py-2 px-3 text-gray-400 font-mono">
                    {src.fetchCount}
                  </td>
                  <td className="py-2 px-3 font-mono">
                    <span
                      className={
                        src.errorCount > 0 ? "text-red-400" : "text-gray-600"
                      }
                    >
                      {src.errorCount}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    {src.lastError ? (
                      <span
                        className="text-red-400 text-xs truncate max-w-[150px] block"
                        title={src.lastError}
                      >
                        Error
                      </span>
                    ) : src.enabled ? (
                      <span className="text-green-400 text-xs">Active</span>
                    ) : (
                      <span className="text-gray-600 text-xs">Disabled</span>
                    )}
                  </td>
                  <td className="py-2 px-3 text-gray-500 text-xs">
                    {src.lastFetchAt
                      ? new Date(src.lastFetchAt).toLocaleString()
                      : "Never"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cron Info */}
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Cron Refresh Endpoint
        </h2>
        <p className="text-sm text-gray-300 font-mono">
          GET /api/cron/refresh
        </p>
        <p className="text-xs text-gray-500 mt-1">
          Call this endpoint periodically to refresh all sources. Set
          CRON_SECRET env var for authentication in production.
        </p>
      </div>
    </div>
  );
}
