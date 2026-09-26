/**
 * One-off cleanup: removes articles that the current team-routing rules
 * would no longer assign to their team (e.g. a college-sports story that a
 * cross-team feed filed under the Mariners).
 *
 * Only touches articles from RSS feeds that filter by team (never sample
 * articles from the seed script). Bookmarked
 * articles and articles you've given an alignment rating are kept.
 *
 *   npm run db:prune            # dry run: lists what would be removed
 *   npm run db:prune -- --apply # actually delete them
 */
import { PrismaClient } from "@prisma/client";
import { RSS_SOURCES } from "../src/lib/config";
import { routeArticle } from "../src/lib/sources/rss-adapter";

const prisma = new PrismaClient();
const apply = process.argv.includes("--apply");

async function main() {
  const filtered = RSS_SOURCES.filter((s) => s.requireTeamMatch || s.teamSlugs);
  const byPublisher = new Map(filtered.map((s) => [s.name, s]));

  const articles = await prisma.article.findMany({
    where: { publisher: { in: Array.from(byPublisher.keys()) } },
    include: { team: { select: { slug: true } }, _count: { select: { bookmarks: true } } },
  });

  const offTopic = articles.filter((a) => {
    if (a.urlHash.startsWith("seed-")) return false; // hand-written sample articles
    const config = byPublisher.get(a.publisher)!;
    const teams = routeArticle(a.title, a.content || a.summary || "", config);
    return !teams.includes(a.team.slug);
  });
  const keep = offTopic.filter((a) => a._count.bookmarks > 0 || a.alignment !== null);
  const remove = offTopic.filter((a) => !keep.includes(a));

  for (const a of remove) console.log(`- [${a.team.slug}] ${a.title} (${a.publisher})`);
  for (const a of keep) console.log(`  kept (bookmarked/rated): [${a.team.slug}] ${a.title}`);

  if (!apply) {
    console.log(`\n${remove.length} off-topic article(s) found. Re-run with --apply to delete them.`);
    return;
  }
  await prisma.article.deleteMany({ where: { id: { in: remove.map((a) => a.id) } } });
  console.log(`\nDeleted ${remove.length} off-topic article(s).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
