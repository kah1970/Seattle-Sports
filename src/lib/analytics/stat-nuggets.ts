import { StatNuggetData } from "@/lib/types";

/**
 * Generates daily stat nuggets (fun facts / interesting stats).
 * All stats updated to reflect the 2025 season and current rosters.
 */

const MARINERS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Julio's Power Leap",
    body: "Julio Rodriguez hit 31 home runs in 2025, a career high, while posting a .291 average \u2014 finally combining elite power with elite contact at age 24.",
    category: "milestone",
  },
  {
    title: "Kirby's Sweeper Secret",
    body: "George Kirby's sweeper generated a 38% whiff rate in 2025, ranking in the 95th percentile league-wide. He added nearly 2 inches of horizontal break to the pitch over the offseason.",
    category: "fun_fact",
  },
  {
    title: "Cal Raleigh: Catcher of the Future",
    body: "Cal Raleigh hit 60 home runs in 2025 — an MLB record for a catcher and the most by any Mariners player in franchise history. He also won his second consecutive Gold Glove.",
    category: "milestone",
  },
  {
    title: "The Rotation's Elite Tier",
    body: "Gilbert, Kirby, and Castillo combined for a sub-3.20 ERA in 2025 \u2014 the best trio in the American League by xERA and the foundation of the Mariners' playoff push.",
    category: "trend",
  },
  {
    title: "T-Mobile Park Pitcher's Advantage",
    body: "T-Mobile Park's home run park factor in 2025 was 0.84, one of the most pitcher-friendly in MLB \u2014 a key reason Seattle's starters consistently outperform their peripheral numbers at home.",
    category: "fun_fact",
  },
  {
    title: "Colt Emerson Watch",
    body: "Colt Emerson, Seattle's top prospect, posted a .312 average with 18 home runs across Double-A and Triple-A in 2025. He could be the Mariners' shortstop of the future as soon as 2026.",
    category: "trend",
  },
];

const SEAHAWKS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Darnold's Super Bowl Redemption",
    body: "Sam Darnold led the Seahawks to Super Bowl LX in 2025 \u2014 completing one of the most remarkable single-season QB turnarounds in NFL history after being cut by the Vikings.",
    category: "milestone",
  },
  {
    title: "JSN: Offensive Player of the Year",
    body: "Jaxon Smith-Njigba's 1,793 receiving yards in 2025 led the NFL and earned him Offensive Player of the Year \u2014 the first Seahawks player to win the award since Steve Largent's era.",
    category: "milestone",
  },
  {
    title: "Witherspoon's Elite Coverage",
    body: "Devon Witherspoon allowed a 48.3% completion rate in man coverage in 2025, posting a PFF grade of 91.2 \u2014 the best by a Seahawks corner since Richard Sherman's peak years.",
    category: "comparison",
  },
  {
    title: "12th Man Super Bowl Boost",
    body: "Seattle averaged 5.1 more points per game at home during the 2025 regular season \u2014 Lumen Field's crowd noise remains one of the NFL's most measured home-field advantages.",
    category: "fun_fact",
  },
  {
    title: "Walker's Return",
    body: "Kenneth Walker III enters 2026 healthy after an injury-shortened 2025. In the games he did play, he averaged 4.8 yards per carry \u2014 his best mark since his rookie season.",
    category: "trend",
  },
];

const SONICS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Kemp & Payton: The Dynasty That Was",
    body: "The Shawn Kemp / Gary Payton duo led the SuperSonics to a franchise-best 64-18 record in 1995-96, reaching the NBA Finals before falling to the 72-win Bulls.",
    category: "fun_fact",
  },
  {
    title: "Ray Allen's Shooting Clinic",
    body: "Ray Allen shot 45.4% from three in his first season with Seattle (2003-04), one of the highest single-season marks in franchise history.",
    category: "milestone",
  },
  {
    title: "The Reign Man's Dunks",
    body: "Shawn Kemp appeared in 6 NBA All-Star games and won the 1994 Slam Dunk Contest, bringing a level of athleticism that defined an era of Seattle basketball.",
    category: "fun_fact",
  },
  {
    title: "Expansion Bid Filed",
    body: "A Seattle ownership group filed a formal NBA expansion bid in February 2026, citing Climate Pledge Arena (already NBA-spec) and Seattle ranking as the 7th-largest NBA market by revenue potential.",
    category: "trend",
  },
  {
    title: "Jack Sikma's Quiet Greatness",
    body: "Jack Sikma averaged 15.6 points and 9.8 rebounds per game across 9 seasons in Seattle, anchoring the 1979 championship team. He was inducted into the Hall of Fame in 2019.",
    category: "milestone",
  },
];

const COUGARS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Cougar Pride: Ryan Leaf to Drew Bledsoe",
    body: "WSU has produced 3 Heisman Trophy finalists and NFL first-round QBs including Ryan Leaf (1998 #2 pick) and Drew Bledsoe (1993 #1 pick) — a legacy of elite quarterback development in Pullman.",
    category: "fun_fact",
  },
  {
    title: "Air Raid Capital of the World",
    body: "Mike Leach's Air Raid offense at WSU (2012-2019) produced some of the most prolific passing seasons in college football history. Luke Falk threw for 14,481 career yards — then a Pac-12 record.",
    category: "milestone",
  },
  {
    title: "Dickert Era Rising",
    body: "Under Jake Dickert, WSU has rebuilt post-Pac-12 as an independent and founding member of the new Pac-12. The Cougars have retained key recruiting pipelines despite unprecedented conference upheaval.",
    category: "trend",
  },
  {
    title: "Kyle Smith's Program",
    body: "Kyle Smith has transformed WSU men's basketball, leading the Cougars to multiple NCAA Tournament appearances. His motion offense and defensive intensity have made Pullman relevant nationally.",
    category: "trend",
  },
  {
    title: "Friel Court Fortress",
    body: "WSU's Friel Court inside Beasley Coliseum is one of college basketball's most intimidating home-court environments. The Cougars have a storied history of upsetting ranked opponents at home.",
    category: "fun_fact",
  },
];

const NUGGET_POOLS: Record<
  string,
  { nuggets: Omit<StatNuggetData, "teamSlug" | "sport">[]; sport: string }
> = {
  mariners: { nuggets: MARINERS_NUGGETS, sport: "MLB" },
  seahawks: { nuggets: SEAHAWKS_NUGGETS, sport: "NFL" },
  supersonics: { nuggets: SONICS_NUGGETS, sport: "NBA" },
  cougars: { nuggets: COUGARS_NUGGETS, sport: "NCAA" },
};

/**
 * Get a stat nugget for a team for today.
 * Uses day-of-year to cycle through the pool deterministically.
 */
export function getDailyStatNugget(teamSlug: string): StatNuggetData | null {
  const pool = NUGGET_POOLS[teamSlug];
  if (!pool) return null;

  const dayOfYear = getDayOfYear(new Date());
  const index = dayOfYear % pool.nuggets.length;
  const nugget = pool.nuggets[index];

  return {
    ...nugget,
    teamSlug,
    sport: pool.sport,
  };
}

export function getAllDailyNuggets(): StatNuggetData[] {
  return Object.keys(NUGGET_POOLS)
    .map(getDailyStatNugget)
    .filter((n): n is StatNuggetData => n !== null);
}

function getDayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = date.getTime() - start.getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}
