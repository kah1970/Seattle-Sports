import { describe, it, expect, vi, afterEach } from "vitest";
import { parseEspnSeasonSummary, fetchTodaysGame } from "../stats";
import { describeGame } from "../team-status";
import { COUGARS_TEAM_SUMMARY, COUGARS_SCOREBOARD } from "./fixtures/espn-cougars";

describe("parseEspnSeasonSummary (Cougars, college football)", () => {
  it("reads WSU's record and Pac-12 standing from the ESPN team endpoint", () => {
    expect(parseEspnSeasonSummary(COUGARS_TEAM_SUMMARY, 2026)).toEqual({
      season: 2026,
      record: "1-2",
      standing: "1st in Pac-12",
    });
  });
});

describe("fetchTodaysGame('cougars')", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("parses WSU's game from the ESPN college-football scoreboard", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify(COUGARS_SCOREBOARD)))
    );

    const game = await fetchTodaysGame("cougars");
    expect(game).toMatchObject({
      found: true,
      isToday: true,
      opponent: "Arizona Wildcats",
      isHome: true,
      venue: "Martin Stadium",
      status: "scheduled",
      teamRecord: "1-2",
      opponentRecord: "2-1",
    });

    // And it flows through the scoreboard-strip formatter.
    const described = describeGame(game, new Date("2026-09-26T18:00:00Z"));
    expect(described?.text).toContain("vs Wildcats");
    expect(described?.live).toBe(false);
  });
});
