import { describe, it, expect } from "vitest";
import { describeGame, nickname } from "../team-status";
import type { TodaysGameData } from "../stats";

// 2026-09-26 12:00 PDT
const NOW = new Date("2026-09-26T19:00:00Z");

function game(overrides: Partial<TodaysGameData>): TodaysGameData {
  return {
    found: true,
    isToday: true,
    gameDate: "2026-09-27T01:40:00Z", // 6:40 PM PDT on Sep 26
    opponent: "Los Angeles Angels",
    isHome: true,
    venue: "T-Mobile Park",
    status: "scheduled",
    ...overrides,
  };
}

describe("nickname", () => {
  it("drops the city", () => {
    expect(nickname("Los Angeles Angels")).toBe("Angels");
    expect(nickname("San Francisco 49ers")).toBe("49ers");
    expect(nickname("Boston Red Sox")).toBe("Red Sox");
    expect(nickname("Toronto Blue Jays")).toBe("Blue Jays");
  });
});

describe("describeGame", () => {
  it("uses Seattle time for evening games", () => {
    expect(describeGame(game({}), NOW)).toEqual({ text: "Tonight 6:40 PM vs Angels", live: false });
  });

  it("labels tomorrow and later games", () => {
    expect(describeGame(game({ gameDate: "2026-09-27T20:10:00Z" }), NOW)!.text).toBe(
      "Tomorrow 1:10 PM vs Angels"
    );
    expect(
      describeGame(game({ gameDate: "2026-09-29T02:10:00Z", isHome: false, opponent: "Houston Astros" }), NOW)!.text
    ).toBe("Mon 7:10 PM @ Astros");
  });

  it("shows live and final scores from Seattle's side", () => {
    expect(describeGame(game({ status: "live", isHome: false, homeScore: 2, awayScore: 3 }), NOW)).toEqual({
      text: "LIVE · 3-2 @ Angels",
      live: true,
    });
    expect(describeGame(game({ status: "final", homeScore: 2, awayScore: 5 }), NOW)!.text).toBe(
      "Final · L 2-5 vs Angels"
    );
  });

  it("returns null with no game", () => {
    expect(describeGame(null, NOW)).toBeNull();
    expect(describeGame(game({ found: false }), NOW)).toBeNull();
  });
});
