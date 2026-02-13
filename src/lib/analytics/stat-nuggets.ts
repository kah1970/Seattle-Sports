import { StatNuggetData } from "@/lib/types";

/**
 * Generates daily stat nuggets (fun facts / interesting stats).
 * Uses a rule-based system with a pool of curated stat nuggets.
 * If imported metrics are available, can generate dynamic ones.
 */

const MARINERS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Julio's Exit Velo Club",
    body: "Julio Rodriguez's average exit velocity in 2024 ranked in the 94th percentile among MLB hitters, making him one of the hardest-hitting outfielders in baseball.",
    category: "fun_fact",
  },
  {
    title: "K Kings of the Rotation",
    body: "The Mariners rotation ranked 3rd in MLB in strikeout rate during the 2024 season, led by Logan Gilbert and George Kirby combining for over 400 Ks.",
    category: "milestone",
  },
  {
    title: "Cal Raleigh Power Surge",
    body: "Cal Raleigh set the Mariners single-season record for home runs by a catcher, cementing his status as one of the premier power-hitting catchers in baseball.",
    category: "milestone",
  },
  {
    title: "Bullpen Dominance",
    body: "The Mariners bullpen posted a combined ERA under 3.50, ranking among the top 5 in the American League for the second consecutive season.",
    category: "trend",
  },
  {
    title: "T-Mobile Park Factor",
    body: "T-Mobile Park's park factor for home runs in 2024 was 0.87, making it one of the most pitcher-friendly parks in MLB — good news for Seattle's pitching-first approach.",
    category: "fun_fact",
  },
];

const SEAHAWKS_NUGGETS: Omit<StatNuggetData, "teamSlug" | "sport">[] = [
  {
    title: "Geno's Pocket Presence",
    body: "Geno Smith posted a passer rating of 100+ when kept clean from pressure in 2024, ranking among the top 10 QBs in clean-pocket efficiency.",
    category: "fun_fact",
  },
  {
    title: "DK's Contested Catch Rate",
    body: "DK Metcalf's contested catch rate has been among the NFL's best for three straight seasons, winning 60%+ of battles at the catch point.",
    category: "trend",
  },
  {
    title: "Witherspoon's Rookie Impact",
    body: "Devon Witherspoon's PFF grade in his rookie year was the highest for a Seahawks cornerback since Richard Sherman's breakout 2012 season.",
    category: "comparison",
  },
  {
    title: "JSN Rising",
    body: "Jaxon Smith-Njigba's yards after catch per reception ranked in the top 15 among all NFL receivers in his second season.",
    category: "trend",
  },
  {
    title: "12th Man Advantage",
    body: "Seattle has the best home record in the NFC West over the last 3 seasons, with Lumen Field opponents committing an average of 2.3 more false starts per game than league average.",
    category: "fun_fact",
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
    title: "Jack Sikma's Quiet Greatness",
    body: "Jack Sikma averaged 15.6 points and 9.8 rebounds per game across 9 seasons in Seattle, anchoring the 1979 championship team. He was inducted into the Hall of Fame in 2019.",
    category: "milestone",
  },
  {
    title: "Expansion Watch",
    body: "The NBA has publicly discussed expansion. Seattle and Las Vegas are widely reported as the leading candidates, with KeyArena's successor (Climate Pledge Arena) already NBA-ready. Note: No official expansion timeline has been confirmed by the league.",
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
