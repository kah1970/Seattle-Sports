import { GameInfo, SourceAdapter, ArticleItem } from "@/lib/types";

/**
 * NFL Scores adapter for Seattle Seahawks.
 *
 * TODO: The NFL does not provide a freely accessible public API for scores.
 * Options for production:
 * 1. Use a licensed data provider (e.g., Sportradar, TheRundown)
 * 2. Use ESPN's public-facing endpoints (unofficial, may change)
 * 3. Manual entry via admin UI
 *
 * For MVP, this adapter returns mocked schedule data and can be
 * swapped for a real provider by implementing the same interface.
 */

const MOCK_SEAHAWKS_SCHEDULE: GameInfo[] = [
  {
    sport: "NFL",
    teamSlug: "seahawks",
    opponent: "San Francisco 49ers",
    gameDate: new Date("2025-09-07T20:25:00Z"),
    isHome: true,
    venue: "Lumen Field",
    status: "scheduled",
    externalId: "nfl-2025-week1-sea",
  },
  {
    sport: "NFL",
    teamSlug: "seahawks",
    opponent: "New England Patriots",
    gameDate: new Date("2025-09-14T20:05:00Z"),
    isHome: false,
    venue: "Gillette Stadium",
    status: "scheduled",
    externalId: "nfl-2025-week2-sea",
  },
  {
    sport: "NFL",
    teamSlug: "seahawks",
    opponent: "Arizona Cardinals",
    gameDate: new Date("2025-09-21T16:25:00Z"),
    isHome: true,
    venue: "Lumen Field",
    status: "scheduled",
    externalId: "nfl-2025-week3-sea",
  },
  {
    sport: "NFL",
    teamSlug: "seahawks",
    opponent: "Los Angeles Rams",
    gameDate: new Date("2025-09-28T16:05:00Z"),
    isHome: false,
    venue: "SoFi Stadium",
    status: "scheduled",
    externalId: "nfl-2025-week4-sea",
  },
  {
    sport: "NFL",
    teamSlug: "seahawks",
    opponent: "Dallas Cowboys",
    gameDate: new Date("2025-10-05T20:20:00Z"),
    isHome: true,
    venue: "Lumen Field",
    status: "scheduled",
    externalId: "nfl-2025-week5-sea",
  },
];

export function createNFLScoresAdapter(): SourceAdapter {
  return {
    name: "NFL Schedule (Mock)",
    type: "mock",

    async fetch(): Promise<ArticleItem[]> {
      return [];
    },

    async fetchScores(): Promise<GameInfo[]> {
      // TODO: Replace with real API provider
      // Return mock schedule data for development
      return MOCK_SEAHAWKS_SCHEDULE;
    },

    async healthCheck() {
      return {
        ok: true,
        message:
          "Mock adapter active. Replace with licensed API for production.",
      };
    },
  };
}
