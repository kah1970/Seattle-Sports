export const TEAMS = {
  mariners: {
    id: "mariners",
    name: "Seattle Mariners",
    slug: "mariners",
    sport: "MLB",
    colorPrimary: "#0C2C56",
    colorSecondary: "#005C5C",
    colorAccent: "#C4CED4",
  },
  seahawks: {
    id: "seahawks",
    name: "Seattle Seahawks",
    slug: "seahawks",
    sport: "NFL",
    colorPrimary: "#002244",
    colorSecondary: "#69BE28",
    colorAccent: "#A5ACAF",
  },
  supersonics: {
    id: "supersonics",
    name: "Seattle SuperSonics",
    slug: "supersonics",
    sport: "NBA",
    colorPrimary: "#FFC200",
    colorSecondary: "#00653A",
    colorAccent: "#1D428A",
  },
} as const;

export type TeamSlug = keyof typeof TEAMS;

export const SPORTS = ["MLB", "NFL", "NBA"] as const;
export type Sport = (typeof SPORTS)[number];

export const RSS_SOURCES = [
  // Mariners
  {
    name: "ESPN MLB - Mariners",
    slug: "espn-mlb-mariners",
    url: "https://www.espn.com/espn/rss/mlb/news",
    teamSlug: "mariners",
    sport: "MLB" as Sport,
    reputation: 85,
  },
  {
    name: "MLB.com Mariners News",
    slug: "mlb-mariners",
    url: "https://www.mlb.com/mariners/feeds/news/rss.xml",
    teamSlug: "mariners",
    sport: "MLB" as Sport,
    reputation: 95,
  },
  // Seahawks
  {
    name: "ESPN NFL - Seahawks",
    slug: "espn-nfl-seahawks",
    url: "https://www.espn.com/espn/rss/nfl/news",
    teamSlug: "seahawks",
    sport: "NFL" as Sport,
    reputation: 85,
  },
  {
    name: "Seahawks.com Official",
    slug: "seahawks-official",
    url: "https://www.seahawks.com/news/rss",
    teamSlug: "seahawks",
    sport: "NFL" as Sport,
    reputation: 90,
  },
  // SuperSonics / NBA
  {
    name: "ESPN NBA",
    slug: "espn-nba",
    url: "https://www.espn.com/espn/rss/nba/news",
    teamSlug: "supersonics",
    sport: "NBA" as Sport,
    reputation: 80,
  },
  // Seattle sports general
  {
    name: "Seattle Times Sports",
    slug: "seattle-times-sports",
    url: "https://www.seattletimes.com/sports/feed/",
    teamSlug: "mariners", // cross-team, default mapping
    sport: "MLB" as Sport,
    reputation: 80,
  },
];

export const PUBLISHER_REPUTATION: Record<string, number> = {
  "ESPN": 85,
  "The Athletic": 90,
  "MLB.com": 95,
  "NFL.com": 90,
  "NBA.com": 90,
  "Seahawks.com": 88,
  "Seattle Times": 80,
  "FanGraphs": 88,
  "Baseball Reference": 85,
  "Pro Football Reference": 85,
  "StatMuse": 70,
  "Bleacher Report": 60,
  "default": 50,
};

export const RANKING_WEIGHTS = {
  recency: 0.35,
  reputation: 0.25,
  analysisDepth: 0.25,
  engagement: 0.15,
};

export const FEATURE_FLAGS = {
  REDIS_CACHE: process.env.REDIS_URL ? true : false,
  LLM_SUMMARIES: process.env.LLM_API_KEY ? true : false,
  LIVE_SCORES: process.env.LIVE_SCORES_ENABLED === "true",
};
