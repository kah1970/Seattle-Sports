import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create teams
  const mariners = await prisma.team.upsert({
    where: { slug: "mariners" },
    update: {},
    create: {
      name: "Seattle Mariners",
      slug: "mariners",
      sport: "MLB",
      city: "Seattle",
      colorPrimary: "#0C2C56",
      colorSecondary: "#005C5C",
    },
  });

  const seahawks = await prisma.team.upsert({
    where: { slug: "seahawks" },
    update: {},
    create: {
      name: "Seattle Seahawks",
      slug: "seahawks",
      sport: "NFL",
      city: "Seattle",
      colorPrimary: "#002244",
      colorSecondary: "#69BE28",
    },
  });

  const supersonics = await prisma.team.upsert({
    where: { slug: "supersonics" },
    update: {},
    create: {
      name: "Seattle SuperSonics",
      slug: "supersonics",
      sport: "NBA",
      city: "Seattle",
      colorPrimary: "#FFC200",
      colorSecondary: "#00653A",
    },
  });

  // Create sources
  const sources = [
    { name: "ESPN MLB", slug: "espn-mlb", type: "rss", reputation: 85 },
    { name: "MLB.com", slug: "mlb-com", type: "rss", reputation: 95 },
    { name: "ESPN NFL", slug: "espn-nfl", type: "rss", reputation: 85 },
    { name: "Seahawks.com", slug: "seahawks-com", type: "rss", reputation: 90 },
    { name: "ESPN NBA", slug: "espn-nba", type: "rss", reputation: 80 },
    { name: "Seattle Times", slug: "seattle-times", type: "rss", reputation: 80 },
    { name: "MLB Stats API", slug: "mlb-stats-api", type: "api", reputation: 100 },
    { name: "Manual Import", slug: "manual-import", type: "csv_import", reputation: 75 },
  ];

  for (const src of sources) {
    await prisma.source.upsert({
      where: { slug: src.slug },
      update: {},
      create: src,
    });
  }

  const espnMlb = await prisma.source.findUnique({ where: { slug: "espn-mlb" } });
  const espnNfl = await prisma.source.findUnique({ where: { slug: "espn-nfl" } });
  const espnNba = await prisma.source.findUnique({ where: { slug: "espn-nba" } });

  // Seed sample articles
  const sampleArticles = [
    {
      title: "Julio Rodriguez Extends Hit Streak to 15 Games",
      url: "https://example.com/julio-hit-streak",
      urlHash: "seed-julio-hit-streak",
      publisher: "ESPN MLB",
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
      summary: "Julio Rodriguez continued his torrid stretch with a 3-for-4 performance, extending his hitting streak to 15 games.",
      articleType: "news",
      sport: "MLB",
      analysisDepth: 0.3,
      rankScore: 0.75,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
    {
      title: "Breaking Down George Kirby's Pitch Arsenal: A Statcast Deep Dive",
      url: "https://example.com/kirby-statcast",
      urlHash: "seed-kirby-statcast",
      publisher: "ESPN MLB",
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000),
      summary: "An in-depth look at how Kirby's sweeper and four-seam fastball grade out by expected stats and pitch value metrics.",
      articleType: "analysis",
      sport: "MLB",
      analysisDepth: 0.85,
      rankScore: 0.7,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
    {
      title: "Mariners Pitching Staff Continues to Dominate AL",
      url: "https://example.com/mariners-pitching-dominance",
      urlHash: "seed-mariners-pitching",
      publisher: "MLB.com",
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
      summary: "Seattle's rotation leads the American League in ERA and strikeout rate through the first month of the season.",
      articleType: "analysis",
      sport: "MLB",
      analysisDepth: 0.6,
      rankScore: 0.72,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
    {
      title: "DK Metcalf Working on Route Refinement This Offseason",
      url: "https://example.com/dk-routes",
      urlHash: "seed-dk-routes",
      publisher: "ESPN NFL",
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      summary: "Metcalf has been focused on running sharper intermediate routes to complement his deep threat ability.",
      articleType: "news",
      sport: "NFL",
      analysisDepth: 0.4,
      rankScore: 0.65,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "Seahawks Defense: What Devon Witherspoon's PFF Grade Tells Us",
      url: "https://example.com/witherspoon-pff",
      urlHash: "seed-witherspoon-pff",
      publisher: "ESPN NFL",
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
      summary: "Witherspoon graded as one of the top cornerbacks in the NFL per PFF, and his film breakdown shows why Seattle's secondary looks elite.",
      articleType: "analysis",
      sport: "NFL",
      analysisDepth: 0.8,
      rankScore: 0.73,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "Kenneth Walker III Poised for Breakout Season",
      url: "https://example.com/walker-breakout",
      urlHash: "seed-walker-breakout",
      publisher: "Seahawks.com",
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000),
      summary: "After battling injuries, Kenneth Walker III enters 2025 healthy and motivated. Here's why the coaching staff is optimistic.",
      articleType: "news",
      sport: "NFL",
      analysisDepth: 0.35,
      rankScore: 0.6,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "On This Day: SuperSonics Win 1979 NBA Championship",
      url: "https://example.com/sonics-1979",
      urlHash: "seed-sonics-1979",
      publisher: "ESPN NBA",
      publishedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      summary: "Revisiting the greatest moment in Seattle basketball history, when the SuperSonics defeated the Washington Bullets to claim the franchise's only championship.",
      articleType: "retrospective",
      sport: "NBA",
      analysisDepth: 0.7,
      rankScore: 0.55,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "Sonics Watch: NBA Expansion Update — What We Know and Don't Know",
      url: "https://example.com/sonics-expansion",
      urlHash: "seed-sonics-expansion",
      publisher: "Seattle Times",
      publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
      summary: "An update on NBA expansion discussions. While Seattle remains a strong candidate, no official decision has been announced. We separate confirmed facts from speculation.",
      articleType: "news",
      sport: "NBA",
      analysisDepth: 0.5,
      rankScore: 0.68,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "Gary Payton: The Glove's Legacy in Seattle",
      url: "https://example.com/payton-legacy",
      urlHash: "seed-payton-legacy",
      publisher: "ESPN NBA",
      publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
      summary: "How Gary Payton's tenacious defense and leadership defined the SuperSonics' identity throughout the 1990s.",
      articleType: "retrospective",
      sport: "NBA",
      analysisDepth: 0.65,
      rankScore: 0.5,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "Mariners Highlights: Top Plays from Last Night's Win",
      url: "https://example.com/mariners-highlights",
      urlHash: "seed-mariners-highlights",
      publisher: "MLB.com",
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000),
      summary: "Watch the best plays from the Mariners' 6-2 victory, including Cal Raleigh's 2-run homer.",
      articleType: "highlights",
      sport: "MLB",
      isHighlight: true,
      videoUrl: "https://www.youtube.com/watch?v=example",
      analysisDepth: 0.1,
      rankScore: 0.62,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { urlHash: article.urlHash },
      update: {},
      create: article,
    });
  }

  // Seed tags
  const tagNames = [
    "julio-rodriguez", "cal-raleigh", "george-kirby", "logan-gilbert",
    "dk-metcalf", "geno-smith", "devon-witherspoon", "kenneth-walker",
    "gary-payton", "shawn-kemp", "expansion",
    "trades", "injuries", "draft", "playoffs", "spring-training",
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name: name.replace(/-/g, " "), slug: name },
    });
  }

  // Seed game schedules
  const games = [
    {
      sport: "MLB",
      teamSlug: "mariners",
      opponent: "Houston Astros",
      gameDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      isHome: true,
      venue: "T-Mobile Park",
      status: "scheduled",
      externalId: "seed-mlb-1",
    },
    {
      sport: "MLB",
      teamSlug: "mariners",
      opponent: "Texas Rangers",
      gameDate: new Date(Date.now() + 48 * 60 * 60 * 1000),
      isHome: true,
      venue: "T-Mobile Park",
      status: "scheduled",
      externalId: "seed-mlb-2",
    },
    {
      sport: "MLB",
      teamSlug: "mariners",
      opponent: "Los Angeles Angels",
      gameDate: new Date(Date.now() - 12 * 60 * 60 * 1000),
      isHome: false,
      venue: "Angel Stadium",
      status: "final",
      homeScore: 2,
      awayScore: 6,
      externalId: "seed-mlb-3",
    },
    {
      sport: "NFL",
      teamSlug: "seahawks",
      opponent: "San Francisco 49ers",
      gameDate: new Date("2025-09-07T20:25:00Z"),
      isHome: true,
      venue: "Lumen Field",
      status: "scheduled",
      externalId: "seed-nfl-1",
    },
  ];

  for (const game of games) {
    await prisma.gameSchedule.upsert({
      where: { externalId: game.externalId },
      update: {},
      create: game,
    });
  }

  // Seed some sample metrics
  const sampleMetrics = [
    { name: "war", value: 4.2, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2024" },
    { name: "avg", value: 0.282, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2024" },
    { name: "home_runs", value: 28, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2024" },
    { name: "era", value: 3.25, category: "pitching", playerName: "Logan Gilbert", teamId: mariners.id, season: "2024" },
    { name: "war", value: 5.1, category: "pitching", playerName: "Logan Gilbert", teamId: mariners.id, season: "2024" },
    { name: "k_per_9", value: 9.8, category: "pitching", playerName: "George Kirby", teamId: mariners.id, season: "2024" },
    { name: "era", value: 3.10, category: "pitching", playerName: "George Kirby", teamId: mariners.id, season: "2024" },
    { name: "home_runs", value: 32, category: "batting", playerName: "Cal Raleigh", teamId: mariners.id, season: "2024" },
    { name: "pass_yards", value: 3624, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2024" },
    { name: "pass_td", value: 22, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2024" },
    { name: "qbr", value: 58.3, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2024" },
    { name: "recv_yards", value: 1040, category: "receiving", playerName: "DK Metcalf", teamId: seahawks.id, season: "2024" },
    { name: "recv_td", value: 8, category: "receiving", playerName: "DK Metcalf", teamId: seahawks.id, season: "2024" },
    { name: "rush_yards", value: 905, category: "rushing", playerName: "Kenneth Walker III", teamId: seahawks.id, season: "2024" },
    { name: "ppg", value: 20.3, category: "historic", playerName: "Gary Payton", teamId: supersonics.id, season: "1999-00" },
    { name: "ppg", value: 17.8, category: "historic", playerName: "Shawn Kemp", teamId: supersonics.id, season: "1995-96" },
    { name: "ppg", value: 25.1, category: "historic", playerName: "Ray Allen", teamId: supersonics.id, season: "2006-07" },
  ];

  for (const metric of sampleMetrics) {
    await prisma.metric.create({ data: metric });
  }

  console.log("Seed complete!");
  console.log(`  Teams: 3`);
  console.log(`  Sources: ${sources.length}`);
  console.log(`  Articles: ${sampleArticles.length}`);
  console.log(`  Games: ${games.length}`);
  console.log(`  Metrics: ${sampleMetrics.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
