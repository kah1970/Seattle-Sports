import { GameInfo, SourceAdapter, ArticleItem } from "@/lib/types";

/**
 * NFL Scores adapter for Seattle Seahawks.
 * Uses ESPN's unofficial public API — free, no API key required.
 * Seahawks ESPN team ID: 26
 */

const SEAHAWKS_ESPN_ID = 26;
const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports/football/nfl";
const CURRENT_SEASON = 2025;

interface ESPNEvent {
  id: string;
  date: string;
  name: string;
  competitions: Array<{
    venue?: { fullName: string };
    competitors: Array<{
      id: string;
      homeAway: string;
      team: { displayName: string; id: string };
      score?: string;
    }>;
    status: {
      type: { completed: boolean; description: string; state: string };
    };
  }>;
}

function mapESPNStatus(state: string, completed: boolean): "scheduled" | "live" | "final" {
  if (completed) return "final";
  if (state === "in") return "live";
  return "scheduled";
}

export function createNFLScoresAdapter(): SourceAdapter {
  return {
    name: "NFL Scores (ESPN)",
    type: "api",

    async fetch(): Promise<ArticleItem[]> {
      return [];
    },

    async fetchScores(): Promise<GameInfo[]> {
      try {
        // ESPN scoreboard for current week + full season schedule
        const url = `${ESPN_API}/teams/${SEAHAWKS_ESPN_ID}/schedule?season=${CURRENT_SEASON}`;
        const res = await fetch(url, {
          next: { revalidate: 300 }, // refresh every 5 minutes
          headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
          throw new Error(`ESPN NFL API returned ${res.status}`);
        }

        const data = await res.json();
        const events: ESPNEvent[] = data.events || [];
        const games: GameInfo[] = [];

        for (const event of events) {
          const comp = event.competitions?.[0];
          if (!comp) continue;

          const seahawksComp = comp.competitors.find(
            (c) => c.team.id === String(SEAHAWKS_ESPN_ID)
          );
          const opponentComp = comp.competitors.find(
            (c) => c.team.id !== String(SEAHAWKS_ESPN_ID)
          );

          if (!seahawksComp || !opponentComp) continue;

          const isHome = seahawksComp.homeAway === "home";
          const status = mapESPNStatus(
            comp.status.type.state,
            comp.status.type.completed
          );

          const homeComp = comp.competitors.find((c) => c.homeAway === "home");
          const awayComp = comp.competitors.find((c) => c.homeAway === "away");

          games.push({
            sport: "NFL",
            teamSlug: "seahawks",
            opponent: opponentComp.team.displayName,
            gameDate: new Date(event.date),
            isHome,
            venue: comp.venue?.fullName,
            status,
            homeScore: homeComp?.score ? Number(homeComp.score) : undefined,
            awayScore: awayComp?.score ? Number(awayComp.score) : undefined,
            externalId: `espn-nfl-${event.id}`,
          });
        }

        return games;
      } catch (error) {
        console.error("[NFLScoresAdapter] Error fetching scores:", error);
        return [];
      }
    },

    async healthCheck() {
      try {
        const res = await fetch(`${ESPN_API}/teams/${SEAHAWKS_ESPN_ID}`);
        return {
          ok: res.ok,
          message: res.ok ? "ESPN NFL API reachable" : `HTTP ${res.status}`,
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
