import { GameInfo, SourceAdapter, ArticleItem } from "@/lib/types";

/**
 * MLB Stats API adapter for Seattle Mariners scores and schedule.
 * Uses the public MLB Stats API (statsapi.mlb.com) which is freely available.
 * Team ID for Seattle Mariners: 136
 */
const MARINERS_TEAM_ID = 136;
const MLB_API_BASE = "https://statsapi.mlb.com/api/v1";

interface MLBGameData {
  gamePk: number;
  gameDate: string;
  status: {
    detailedState: string;
    abstractGameState: string;
  };
  teams: {
    away: {
      team: { name: string };
      score?: number;
    };
    home: {
      team: { name: string };
      score?: number;
    };
  };
  venue?: { name: string };
}

interface MLBScheduleResponse {
  dates: Array<{
    games: MLBGameData[];
  }>;
}

function mapGameStatus(
  abstractState: string
): "scheduled" | "live" | "final" {
  switch (abstractState) {
    case "Final":
      return "final";
    case "Live":
      return "live";
    default:
      return "scheduled";
  }
}

export function createMLBScoresAdapter(): SourceAdapter {
  return {
    name: "MLB Stats API",
    type: "api",

    async fetch(): Promise<ArticleItem[]> {
      // This adapter primarily provides scores, not articles
      return [];
    },

    async fetchScores(): Promise<GameInfo[]> {
      try {
        const today = new Date();
        const startDate = new Date(today);
        startDate.setDate(startDate.getDate() - 7);
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() + 14);

        const startStr = formatDate(startDate);
        const endStr = formatDate(endDate);

        const url = `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&startDate=${startStr}&endDate=${endStr}&hydrate=team,venue`;
        const response = await fetch(url, {
          next: { revalidate: 300 }, // cache 5 min
        });

        if (!response.ok) {
          throw new Error(`MLB API returned ${response.status}`);
        }

        const data: MLBScheduleResponse = await response.json();
        const games: GameInfo[] = [];

        for (const dateEntry of data.dates || []) {
          for (const game of dateEntry.games || []) {
            const isHome =
              game.teams.home.team.name === "Seattle Mariners";
            const opponent = isHome
              ? game.teams.away.team.name
              : game.teams.home.team.name;

            games.push({
              sport: "MLB",
              teamSlug: "mariners",
              opponent,
              gameDate: new Date(game.gameDate),
              isHome,
              venue: game.venue?.name,
              status: mapGameStatus(game.status.abstractGameState),
              homeScore: game.teams.home.score,
              awayScore: game.teams.away.score,
              externalId: `mlb-${game.gamePk}`,
            });
          }
        }

        return games;
      } catch (error) {
        console.error("[MLBScoresAdapter] Error fetching scores:", error);
        return [];
      }
    },

    async healthCheck() {
      try {
        const res = await fetch(
          `${MLB_API_BASE}/schedule?sportId=1&teamId=${MARINERS_TEAM_ID}&startDate=${formatDate(new Date())}&endDate=${formatDate(new Date())}`
        );
        return {
          ok: res.ok,
          message: res.ok ? "MLB API reachable" : `HTTP ${res.status}`,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Unreachable",
        };
      }
    },
  };
}

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}
