export const TEAMS = {
  mariners: {
    id: "mariners",
    name: "Seattle Mariners",
    slug: "mariners",
    sport: "MLB",
    colorPrimary: "#0C2C56",
    colorSecondary: "#005C5C",
    colorAccent: "#C4CED4",
    season2025: {
      record: "5-9",
      finish: "5th AL West",
      notes: ["2026 Season — 2.5 GB", "Bryan Woo: 1.50 ERA, 17 K in 18 IP", "2025: 88-74, AL Wild Card (lost ALDS 3-2)"],
    },
  },
  seahawks: {
    id: "seahawks",
    name: "Seattle Seahawks",
    slug: "seahawks",
    sport: "NFL",
    colorPrimary: "#002244",
    colorSecondary: "#69BE28",
    colorAccent: "#A5ACAF",
    season2025: {
      record: "14-3",
      finish: "Super Bowl LX Champions 🏆",
      notes: ["Sam Darnold: Super Bowl MVP", "JSN: 1,793 rec yds — NFL Offensive POY", "Witherspoon: PFF 91.2 — top CB in NFC"],
    },
  },
  supersonics: {
    id: "supersonics",
    name: "Seattle SuperSonics",
    slug: "supersonics",
    sport: "NBA",
    colorPrimary: "#FFC200",
    colorSecondary: "#00653A",
    colorAccent: "#1D428A",
    season2025: {
      record: "—",
      finish: "Expansion Bid Filed",
      notes: ["Formal NBA expansion bid submitted Feb 2026", "Climate Pledge Arena: NBA-ready", "Decision expected 2026-27"],
    },
  },
  cougars: {
    id: "cougars",
    name: "WSU Cougars",
    slug: "cougars",
    sport: "NCAA",
    colorPrimary: "#981E32",
    colorSecondary: "#5E6A71",
    colorAccent: "#D4D2CB",
    season2025: {
      record: "Football: 8-5 · Basketball: 17-14",
      finish: "New Pac-12 Season",
      notes: ["Football: Jake Dickert, New Pac-12 Conference", "Basketball: Kyle Smith, NCAA Tournament bubble", "Go Cougs! ✊"],
    },
  },
} as const;

export type TeamSlug = keyof typeof TEAMS;

/** Centralized API identifiers for external sports APIs */
export const TEAM_API_IDS: Record<string, { mlbId?: number; espnId?: number; espnSport?: string; division?: string; leagueId?: number }> = {
  mariners: { mlbId: 136, division: "AL West", leagueId: 103 },
  seahawks: { espnId: 26, espnSport: "football/nfl", division: "NFC West" },
  supersonics: { espnId: 41, espnSport: "basketball/nba", division: "Pacific" },
  cougars: { division: "Pac-12" },
};

export const SPORTS = ["MLB", "NFL", "NBA", "NCAA"] as const;
export type Sport = (typeof SPORTS)[number];

export interface RSSSourceConfig {
  name: string;
  slug: string;
  url: string;
  /** Primary team slug. Used when multi-team keyword detection finds no match. */
  teamSlug: string;
  /**
   * Optional: for cross-team feeds, list all possible team slugs.
   * The adapter will emit one ArticleItem per team whose name appears in the article.
   * Falls back to teamSlug if no team keywords match.
   */
  teamSlugs?: string[];
  sport: Sport;
  reputation: number;
  /** Skip fetch if source was checked less than this many minutes ago. Default: 30 */
  minFetchIntervalMinutes?: number;
  /** Cap items returned per fetch to avoid flooding. Default: 20 */
  maxItems?: number;
  /**
   * When true, articles from this feed that don't mention any configured
   * team keyword are dropped. Use for league-wide feeds (e.g. ESPN MLB)
   * to prevent non-Seattle stories from appearing on a team tab.
   */
  requireTeamMatch?: boolean;
}

export const RSS_SOURCES: RSSSourceConfig[] = [
  // ── Mariners ──────────────────────────────────────────────────────────────
  {
    name: "MLB.com Mariners News",
    slug: "mlb-mariners",
    url: "https://www.mlb.com/mariners/feeds/news/rss.xml",
    teamSlug: "mariners",
    sport: "MLB",
    reputation: 95,
    minFetchIntervalMinutes: 20,
    maxItems: 30,
  },
  {
    name: "ESPN MLB",
    slug: "espn-mlb",
    url: "https://www.espn.com/espn/rss/mlb/news",
    teamSlug: "mariners",
    sport: "MLB",
    reputation: 85,
    minFetchIntervalMinutes: 30,
    maxItems: 15,
    requireTeamMatch: true,  // league-wide feed — only keep Mariners-relevant articles
  },
  {
    name: "Lookout Landing",
    slug: "lookout-landing",
    url: "https://www.lookoutlanding.com/rss/index.xml",
    teamSlug: "mariners",
    sport: "MLB",
    reputation: 82,
    minFetchIntervalMinutes: 30,
    maxItems: 20,
  },
  {
    name: "FanGraphs – Mariners",
    slug: "fangraphs-mariners",
    url: "https://blogs.fangraphs.com/tag/seattle-mariners/feed/",
    teamSlug: "mariners",
    sport: "MLB",
    reputation: 90,
    minFetchIntervalMinutes: 60,
    maxItems: 15,
  },
  {
    name: "FanGraphs Community",
    slug: "fangraphs-community",
    url: "https://community.fangraphs.com/feed/",
    teamSlug: "mariners",
    sport: "MLB",
    reputation: 72,
    minFetchIntervalMinutes: 60,
    maxItems: 10,
    requireTeamMatch: true,
  },
  // ── Seahawks ──────────────────────────────────────────────────────────────
  {
    name: "Seahawks.com Official",
    slug: "seahawks-official",
    url: "https://www.seahawks.com/rss/news",
    teamSlug: "seahawks",
    sport: "NFL",
    reputation: 90,
    minFetchIntervalMinutes: 20,
    maxItems: 25,
  },
  {
    name: "ESPN NFL",
    slug: "espn-nfl",
    url: "https://www.espn.com/espn/rss/nfl/news",
    teamSlug: "seahawks",
    sport: "NFL",
    reputation: 85,
    minFetchIntervalMinutes: 30,
    maxItems: 15,
    requireTeamMatch: true,  // league-wide feed — only keep Seahawks-relevant articles
  },
  {
    name: "Field Gulls",
    slug: "field-gulls",
    url: "https://www.fieldgulls.com/rss/index.xml",
    teamSlug: "seahawks",
    sport: "NFL",
    reputation: 80,
    minFetchIntervalMinutes: 45,
    maxItems: 20,
  },
  {
    name: "ProFootballTalk",
    slug: "profootballtalk",
    url: "https://profootballtalk.nbcsports.com/feed/",
    teamSlug: "seahawks",
    sport: "NFL",
    reputation: 78,
    minFetchIntervalMinutes: 30,
    maxItems: 10,
    requireTeamMatch: true,  // national feed — only keep Seahawks-relevant articles
  },
  // ── Cross-team / Local ────────────────────────────────────────────────────
  {
    name: "Seattle Times Sports",
    slug: "seattle-times-sports",
    url: "https://www.seattletimes.com/sports/feed/",
    teamSlug: "mariners",
    teamSlugs: ["mariners", "seahawks", "supersonics"],
    sport: "MLB",
    reputation: 82,
    minFetchIntervalMinutes: 20,
    maxItems: 25,
    requireTeamMatch: true,  // drop Kraken/Sounders/other non-Seattle articles
  },
  {
    name: "710 ESPN Seattle",
    slug: "espn-seattle-710",
    url: "https://sports.mynorthwest.com/feed/",
    teamSlug: "mariners",
    teamSlugs: ["mariners", "seahawks", "supersonics"],
    sport: "MLB",
    reputation: 78,
    minFetchIntervalMinutes: 20,
    maxItems: 20,
    requireTeamMatch: true,  // drop Kraken/Sounders/other non-Seattle articles
  },
  // ── SuperSonics / NBA ─────────────────────────────────────────────────────
  {
    name: "ESPN NBA",
    slug: "espn-nba",
    url: "https://www.espn.com/espn/rss/nba/news",
    teamSlug: "supersonics",
    sport: "NBA",
    reputation: 80,
    minFetchIntervalMinutes: 30,
    maxItems: 15,
    requireTeamMatch: true,  // league-wide feed — only keep Sonics/expansion articles
  },
  // ── WSU Cougars ───────────────────────────────────────────────────────────
  {
    name: "All Cougs Up (SB Nation)",
    slug: "all-cougs-up",
    url: "https://allcougdup.com/feed/",
    teamSlug: "cougars",
    sport: "NCAA",
    reputation: 78,
    minFetchIntervalMinutes: 30,
    maxItems: 25,
    requireTeamMatch: true,
  },
];

/** Keywords used to route cross-team articles to the correct team slug */
export const TEAM_KEYWORDS: Record<string, string[]> = {
  mariners: ["mariners", "m's", "safeco", "t-mobile park", "julio", "raleigh", "gilbert", "kirby", "castillo"],
  seahawks: ["seahawks", "hawks", "lumen field", "darnold", "jsn", "smith-njigba", "witherspoon", "walker", "kupp", "super bowl"],
  supersonics: ["supersonics", "sonics", "seattle nba", "nba expansion", "nba seattle", "climate pledge arena", "key arena", "bring back the sonics", "thunder", "expansion bid"],
  cougars: ["wsu", "cougar", "cougars", "washington state", "pullman", "dickert", "kyle smith", "coug"],
};

export const PUBLISHER_REPUTATION: Record<string, number> = {
  "ESPN": 85,
  "The Athletic": 92,
  "MLB.com": 95,
  "NFL.com": 90,
  "NBA.com": 90,
  "Seahawks.com": 88,
  "Seattle Times": 82,
  "FanGraphs": 90,
  "Lookout Landing": 82,
  "Field Gulls": 80,
  "ProFootballTalk": 78,
  "710 ESPN Seattle": 78,
  "Baseball Reference": 85,
  "Pro Football Reference": 85,
  "StatMuse": 70,
  "Bleacher Report": 60,
  "Manual Input": 100,
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
