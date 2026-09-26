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
  const mlbCom = await prisma.source.findUnique({ where: { slug: "mlb-com" } });

  // Seed sample articles. They carry fixed dates that match their content,
  // so sample stories never look like today's news.
  const sampleArticles = [
    {
      title: "Julio Rodriguez Enters 2026 Spring Training with Eyes on Breakout Season",
      url: "https://www.mlb.com/mariners/news/julio-rodriguez-spring-training-2026",
      urlHash: "seed-julio-spring-2026",
      publisher: "MLB.com",
      publishedAt: new Date("2026-02-18T17:00:00Z"),
      summary: "Julio Rodriguez arrives in Peoria with a revamped swing, focused on cutting strikeouts and improving his OBP in 2026.",
      content: "After a productive 2025, Julio Rodriguez is entering spring training with high expectations. The Mariners centerfielder has been working with hitting coaches over the offseason to refine his approach at the plate, focusing on pitch recognition and driving the ball to the opposite field more consistently.",
      articleType: "spring-training",
      sport: "MLB",
      analysisDepth: 0.4,
      rankScore: 0.78,
      teamId: mariners.id,
      sourceId: mlbCom!.id,
    },
    {
      title: "George Kirby Statcast Profile: Why His Sweeper Grades in the 95th Percentile",
      url: "https://blogs.fangraphs.com/george-kirby-sweeper-statcast-2025/",
      urlHash: "seed-kirby-statcast-2026",
      publisher: "FanGraphs",
      publishedAt: new Date("2026-01-20T17:00:00Z"),
      summary: "Kirby's sweeper generated a 38% whiff rate last season — one of the best in the AL. Here's what Statcast says about its movement and location.",
      content: "George Kirby added nearly 2 inches of horizontal break to his sweeper in 2025, pushing it into elite territory. Combined with his elite command metrics (walk rate under 4%), he's become one of the most efficient arms in baseball. His xERA of 2.91 and FIP of 3.05 suggest his ERA of 3.30 actually undersells his performance.",
      articleType: "analysis",
      sport: "MLB",
      analysisDepth: 0.88,
      rankScore: 0.74,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
    {
      title: "Mariners Spring Training Live: Colt Emerson Makes Early Impression",
      url: "https://www.seattletimes.com/sports/mariners/colt-emerson-spring-training-2026/",
      urlHash: "seed-emerson-spring-2026",
      publisher: "Seattle Times",
      publishedAt: new Date("2026-02-25T21:00:00Z"),
      summary: "The Mariners' top prospect went 2-for-3 with a walk in his first live game action of spring training.",
      content: "Colt Emerson, Baseball America's #1 Mariners prospect, turned heads in his first spring training game. The 21-year-old shortstop showed the patient approach and plus bat speed that have scouts excited about his big league timeline. Manager Scott Servais called his at-bats 'very mature for his age.'",
      articleType: "spring-training",
      sport: "MLB",
      analysisDepth: 0.5,
      rankScore: 0.72,
      teamId: mariners.id,
      sourceId: espnMlb!.id,
    },
    {
      title: "Jaxon Smith-Njigba's Record 2025 Season: What It Means for the Seahawks Offense",
      url: "https://www.fieldgulls.com/2026/2/jsn-1793-yards-offensive-player-year-analysis",
      urlHash: "seed-jsn-2026",
      publisher: "Field Gulls",
      publishedAt: new Date("2026-02-15T18:00:00Z"),
      summary: "JSN's 1,793 receiving yards led the NFL and earned him Offensive Player of the Year. What does it mean for Seattle's 2026 offense?",
      content: "Jaxon Smith-Njigba shattered the Seahawks' single-season receiving yards record in 2025, finishing with 1,793 yards on 117 receptions — numbers that earned him NFL Offensive Player of the Year. Playing opposite Cooper Kupp, JSN forced single coverage all season. His success with Sam Darnold's timing-based system was a key driver of the Super Bowl LX run.",
      articleType: "analysis",
      sport: "NFL",
      analysisDepth: 0.82,
      rankScore: 0.78,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "Devon Witherspoon: The Analytics Behind Seattle's Elite Corner",
      url: "https://www.fieldgulls.com/2026/2/devon-witherspoon-pff-coverage-metrics",
      urlHash: "seed-witherspoon-2026",
      publisher: "Field Gulls",
      publishedAt: new Date("2026-03-05T18:00:00Z"),
      summary: "Witherspoon posted a PFF coverage grade of 91.2 in 2025 — best among Seahawk corners since Richard Sherman's peak years.",
      content: "Using PFF's coverage metrics and Next Gen Stats, Devon Witherspoon allowed a 48.3% completion rate in coverage with 0 touchdowns in 14 games last season. His man-coverage grade of 88.4 puts him in the top-5 corners in the NFL. His ability to press and trail deep routes without help is a defensive coordinator's dream.",
      articleType: "analysis",
      sport: "NFL",
      analysisDepth: 0.82,
      rankScore: 0.75,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "Kenneth Walker III: Healthy and Ready for 2026 — A Full Season Awaits",
      url: "https://profootballtalk.nbcsports.com/2026/02/kenneth-walker-seahawks-2026/",
      urlHash: "seed-walker-2026",
      publisher: "ProFootballTalk",
      publishedAt: new Date("2026-06-01T18:00:00Z"),
      summary: "After an injury-shortened 2025, Kenneth Walker III is expected to be the lead back entering 2026 spring workouts.",
      content: "Kenneth Walker III carried the ball 127 times for 603 yards before a knee injury ended his 2025 season in Week 12. He was a full participant in Super Bowl preparation and the 2026 offseason program. Head coach Mike Macdonald confirmed Walker is the starter entering spring workouts.",
      articleType: "news",
      sport: "NFL",
      analysisDepth: 0.38,
      rankScore: 0.65,
      teamId: seahawks.id,
      sourceId: espnNfl!.id,
    },
    {
      title: "On This Day: SuperSonics Win 1979 NBA Championship",
      url: "https://www.nba.com/game/0021900001/history",
      urlHash: "seed-sonics-1979",
      publisher: "ESPN NBA",
      publishedAt: new Date("2026-06-01T15:00:00Z"),
      summary: "Revisiting the greatest moment in Seattle basketball history — the SuperSonics' championship in 1979 over the Washington Bullets.",
      content: "On June 1, 1979, the Seattle SuperSonics defeated the Washington Bullets 97-93 in Game 5 to claim the franchise's only NBA Championship. Gus Williams scored 23 points, Dennis Johnson added 21, and Jack Sikma controlled the boards. Coach Lenny Wilkens became the first player-coach to win an NBA title.",
      articleType: "retrospective",
      sport: "NBA",
      analysisDepth: 0.7,
      rankScore: 0.58,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "NBA Expansion 2026: Seattle's New Ownership Group Files Formal Bid",
      url: "https://www.seattletimes.com/sports/other-sports/nba-expansion-seattle-2026-bid/",
      urlHash: "seed-sonics-expansion-2026",
      publisher: "Seattle Times",
      publishedAt: new Date("2026-02-20T19:00:00Z"),
      summary: "A new Seattle ownership group has formally submitted an expansion bid to the NBA, citing Climate Pledge Arena and projected market revenue.",
      content: "A consortium of Seattle investors led by technology executives has submitted a formal NBA expansion bid, the group confirmed Tuesday. The bid includes arena plans at the modernized Climate Pledge Arena, a market analysis showing Seattle as the 7th-largest NBA market by revenue potential, and a $500M franchise fee commitment.",
      articleType: "news",
      sport: "NBA",
      analysisDepth: 0.55,
      rankScore: 0.72,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "Gary Payton: The Glove's Legacy in Seattle",
      url: "https://www.nba.com/news/gary-payton-seattle-supersonics-legacy",
      urlHash: "seed-payton-legacy",
      publisher: "ESPN NBA",
      publishedAt: new Date("2026-01-10T18:00:00Z"),
      summary: "How Gary Payton's tenacious defense and leadership defined the SuperSonics' identity throughout the 1990s.",
      content: "Gary Payton earned the nickname 'The Glove' for good reason. From 1990 to 2003, he was one of the most suffocating perimeter defenders in NBA history, winning the Defensive Player of the Year award in 1996 and making 9 All-Defensive First Teams. He remains Seattle's all-time leader in assists and steals.",
      articleType: "retrospective",
      sport: "NBA",
      analysisDepth: 0.65,
      rankScore: 0.52,
      teamId: supersonics.id,
      sourceId: espnNba!.id,
    },
    {
      title: "Mariners Spring Training Camp Report: Pitching Depth is a Real Strength",
      url: "https://www.mlb.com/mariners/news/mariners-spring-training-camp-report-2026",
      urlHash: "seed-mariners-camp-2026",
      publisher: "MLB.com",
      publishedAt: new Date("2026-03-01T18:00:00Z"),
      summary: "Seven quality arms competing for five rotation spots — Seattle may have the deepest pitching staff in Cactus League.",
      content: "The Mariners entered spring training with an embarrassment of pitching riches. Beyond the big three of Gilbert, Kirby, and Castillo, Bryan Woo and Bryce Miller are pushing for starts. Matt Brash and Andrés Muñoz anchor an elite bullpen. Pitching coach Pete Woodworth called it 'the deepest staff I've had in 20 years in this game.'",
      articleType: "spring-training",
      sport: "MLB",
      analysisDepth: 0.48,
      rankScore: 0.68,
      teamId: mariners.id,
      sourceId: mlbCom!.id,
    },
  ];

  for (const article of sampleArticles) {
    await prisma.article.upsert({
      where: { urlHash: article.urlHash },
      update: { publishedAt: article.publishedAt },
      create: article,
    });
  }

  // Seed tags
  const tagNames = [
    "julio-rodriguez", "cal-raleigh", "george-kirby", "logan-gilbert",
    "colt-emerson", "lazaro-montes", "bryan-woo", "bryce-miller",
    "dk-metcalf", "geno-smith", "devon-witherspoon", "kenneth-walker",
    "gary-payton", "expansion",
    "trades", "injuries", "draft", "playoffs", "spring-training",
    "roster-move", "prospects", "rotation", "bullpen",
  ];

  for (const name of tagNames) {
    await prisma.tag.upsert({
      where: { slug: name },
      update: {},
      create: { name: name.replace(/-/g, " "), slug: name },
    });
  }

  // Seed game schedules (2026 season)
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
      gameDate: new Date("2026-09-13T20:25:00Z"),
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

  // Seed sample metrics (2025 season)
  const sampleMetrics = [
    { name: "war", value: 5.1, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2025" },
    { name: "avg", value: 0.291, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2025" },
    { name: "home_runs", value: 31, category: "batting", playerName: "Julio Rodriguez", teamId: mariners.id, season: "2025" },
    { name: "era", value: 3.05, category: "pitching", playerName: "Logan Gilbert", teamId: mariners.id, season: "2025" },
    { name: "war", value: 5.4, category: "pitching", playerName: "Logan Gilbert", teamId: mariners.id, season: "2025" },
    { name: "k_per_9", value: 10.2, category: "pitching", playerName: "George Kirby", teamId: mariners.id, season: "2025" },
    { name: "era", value: 3.30, category: "pitching", playerName: "George Kirby", teamId: mariners.id, season: "2025" },
    { name: "home_runs", value: 34, category: "batting", playerName: "Cal Raleigh", teamId: mariners.id, season: "2025" },
    { name: "pass_yards", value: 3780, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2025" },
    { name: "pass_td", value: 25, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2025" },
    { name: "qbr", value: 61.4, category: "passing", playerName: "Geno Smith", teamId: seahawks.id, season: "2025" },
    { name: "recv_yards", value: 1105, category: "receiving", playerName: "DK Metcalf", teamId: seahawks.id, season: "2025" },
    { name: "recv_td", value: 9, category: "receiving", playerName: "DK Metcalf", teamId: seahawks.id, season: "2025" },
    { name: "rush_yards", value: 603, category: "rushing", playerName: "Kenneth Walker III", teamId: seahawks.id, season: "2025" },
    { name: "ppg", value: 20.3, category: "historic", playerName: "Gary Payton", teamId: supersonics.id, season: "1999-00" },
    { name: "ppg", value: 17.8, category: "historic", playerName: "Shawn Kemp", teamId: supersonics.id, season: "1995-96" },
    { name: "ppg", value: 25.1, category: "historic", playerName: "Ray Allen", teamId: supersonics.id, season: "2006-07" },
  ];

  for (const metric of sampleMetrics) {
    await prisma.metric.create({ data: metric }).catch(() => {/* skip duplicates */ });
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
