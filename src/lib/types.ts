export interface ArticleItem {
  title: string;
  url: string;
  publisher: string;
  publishedAt: Date;
  summary?: string;
  content?: string;
  imageUrl?: string;
  sport: string;
  teamSlug: string;
  articleType: "news" | "analysis" | "opinion" | "highlights" | "retrospective" | "spring-training" | "roster-move" | "prospects";
  isHighlight: boolean;
  videoUrl?: string;
  tags?: string[];
}

export interface GameInfo {
  sport: string;
  teamSlug: string;
  opponent: string;
  gameDate: Date;
  isHome: boolean;
  venue?: string;
  status: "scheduled" | "live" | "final";
  homeScore?: number;
  awayScore?: number;
  summary?: string;
  externalId?: string;
}

export interface SourceAdapter {
  name: string;
  type: string;
  /** Per-source fetch TTL in minutes — ingestion skips if fetched more recently than this */
  minFetchIntervalMinutes?: number;
  /** Cap on items returned per fetch */
  maxItems?: number;
  fetch(): Promise<ArticleItem[]>;
  fetchScores?(): Promise<GameInfo[]>;
  healthCheck(): Promise<{ ok: boolean; message: string }>;
}

export interface RankingParams {
  breakingVsAnalysis: number; // 0 = all breaking, 1 = all analysis
}

export interface StatNuggetData {
  sport: string;
  teamSlug: string;
  title: string;
  body: string;
  category: "fun_fact" | "milestone" | "trend" | "comparison";
}

export interface CSVImportConfig {
  sport: string;
  dataType: string;
  columnMapping: Record<string, string>;
  teamSlug: string;
  season?: string;
}
