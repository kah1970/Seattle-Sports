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

  const digests = await Promise.all(
    teams.map(async (team) => {
      let snapshot = await prisma.digestSnapshot.findUnique({
        where: { date_teamId: { date: today, teamId: team.id } },
      });

      if (!snapshot) {
        const topArticles = await prisma.article.findMany({
          where: { teamId: team.id },
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

        snapshot = await prisma.digestSnapshot.create({
          data: {
            date: today,
            teamId: team.id,
            content: JSON.stringify(topArticles),
          },
        });
      }

      return {
        team,
        items: JSON.parse(snapshot.content) as DigestItem[],
      };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Daily Digest</h1>
        <p className="text-sm text-gray-500 mt-1">
          {format(new Date(), "EEEE, MMMM d, yyyy")} — Top stories across
          Seattle sports
        </p>
      </div>

      {digests.map(({ team, items }) => (
        <div key={team.id} className="space-y-3">
          <h2
            className="text-lg font-semibold border-b pb-2"
            style={{
              borderColor: team.colorSecondary + "40",
            }}
          >
            {team.name}
            <span className="text-sm font-normal text-gray-500 ml-2">
              {team.sport}
            </span>
          </h2>

          {items.length === 0 ? (
            <p className="text-sm text-gray-500">
              No articles available for today.
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
                      {item.publisher} — {item.articleType}
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
