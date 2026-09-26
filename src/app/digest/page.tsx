import { prisma } from "@/lib/db";
import Link from "next/link";
import { format } from "date-fns";

export const dynamic = "force-dynamic";

interface DigestItem {
  id: string;
  title: string;
  publisher: string;
  articleType: string;
  rankScore: number;
  url: string;
  summary: string | null;
}

export default async function DigestPage() {
  const today = new Date().toISOString().split("T")[0];
  const teams = await prisma.team.findMany();

  // Only include articles from the last 7 days so digest stays current
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const digests = await Promise.all(
    teams.map(async (team) => {
      // Always check if the cached snapshot has enough recent articles.
      // If snapshot exists but articles are stale, regenerate it.
      let snapshot = await prisma.digestSnapshot.findUnique({
        where: { date_teamId: { date: today, teamId: team.id } },
      });

      // Validate cached snapshot has current articles (not stale seed data)
      let items: DigestItem[] = snapshot
        ? (JSON.parse(snapshot.content) as DigestItem[])
        : [];

      const needsRefresh =
        !snapshot ||
        items.length === 0 ||
        // Detect stale cached data: if all items are from known seed IDs
        // we just always regenerate if there are 0 real articles
        items.every((item) =>
          ["seed-", "demo-"].some((p) => item.id?.startsWith(p))
        );

      if (needsRefresh) {
        const topArticles = await prisma.article.findMany({
          where: {
            teamId: team.id,
            publishedAt: { gte: sevenDaysAgo },
          },
          orderBy: { rankScore: "desc" },
          take: 10,
          select: {
            id: true,
            title: true,
            publisher: true,
            articleType: true,
            rankScore: true,
            url: true,
            summary: true,
          },
        });

        items = topArticles;

        // Upsert snapshot for today
        await prisma.digestSnapshot.upsert({
          where: { date_teamId: { date: today, teamId: team.id } },
          update: { content: JSON.stringify(topArticles) },
          create: {
            date: today,
            teamId: team.id,
            content: JSON.stringify(topArticles),
          },
        });
      }

      return { team, items };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Digest</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} — Top stories from the
          last 7 days across Seattle sports
        </p>
      </div>

      {digests.map(({ team, items }) => (
        <div key={team.id} className="space-y-3">
          <h2
            className="text-lg font-semibold border-b pb-2"
            style={{ borderColor: team.colorSecondary + "40" }}
          >
            {team.name}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {team.sport}
            </span>
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No recent articles in the last 7 days.{" "}
              <a
                href="/api/cron/refresh"
                className="text-[var(--accent)] hover:underline"
              >
                Refresh feeds →
              </a>
            </p>
          ) : (
            <ol className="space-y-2">
              {items.map((item, i) => (
                <li key={item.id || i} className="flex items-start gap-3">
                  <span className="text-xs text-gray-600 font-mono w-5 shrink-0 pt-0.5">
                    {i + 1}.
                  </span>
                  <div>
                    <Link
                      href={`/article/${item.id}`}
                      className="text-sm text-gray-200 hover:text-white transition-colors"
                    >
                      {item.title}
                    </Link>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {item.publisher} —{" "}
                      <span className="capitalize">{item.articleType}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ))}
    </div>
  );
}
