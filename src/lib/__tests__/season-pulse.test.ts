import { describe, it, expect } from "vitest";
import {
  buildSeasonPulse,
  computeVerdict,
  currentMlbSeason,
  ordinal,
  parseGamesBack,
  pulseNugget,
} from "../analytics/season-pulse";
import { STANDINGS, HITTING, PITCHING } from "./fixtures/mlb-pulse";

const MARINERS = 136;

describe("buildSeasonPulse", () => {
  const pulse = buildSeasonPulse(MARINERS, "2026", STANDINGS, HITTING, PITCHING)!;

  it("reads the team's record and standing", () => {
    expect(pulse.wins).toBe(76);
    expect(pulse.losses).toBe(82);
    expect(pulse.division).toBe("American League West");
    expect(pulse.divisionRank).toBe(3);
    expect(pulse.gamesBack).toBe("12.0");
    expect(pulse.lastTen).toBe("3-7");
    expect(pulse.streak).toBe("L3");
    expect(pulse.runDifferential).toBe(-20);
    expect(pulse.winPace).toBe(78);
  });

  it("computes a Pythagorean record from runs", () => {
    expect(pulse.pythagWins! + pulse.pythagLosses!).toBe(158);
    expect(pulse.pythagWins).toBe(77);
  });

  it("ranks the team across MLB, with lower-is-better stats inverted", () => {
    const byLabel = Object.fromEntries(pulse.ranks.map((r) => [r.label, r]));
    expect(byLabel["Runs scored"]).toMatchObject({ rank: 3, of: 4, value: "640" });
    expect(byLabel["OPS"].value).toBe(".680");
    expect(byLabel["Team ERA"]).toMatchObject({ rank: 3, of: 4, value: "4.10" });
  });

  it("is not eliminated unless out of both division and wild card", () => {
    expect(pulse.eliminated).toBe(false);
    expect(pulse.verdict.tone).toBe("bad");
    expect(pulse.verdict.detail).toContain("6.5 games out");
  });

  it("returns null when the team is not in the standings", () => {
    expect(buildSeasonPulse(999, "2026", STANDINGS)).toBeNull();
    expect(buildSeasonPulse(MARINERS, "2026", {})).toBeNull();
  });

  it("works without team stats", () => {
    expect(buildSeasonPulse(MARINERS, "2026", STANDINGS)!.ranks).toEqual([]);
  });
});

describe("computeVerdict", () => {
  const base = {
    wins: 80, losses: 70, divisionRank: 2, gamesBack: "4.0",
    wildCardGamesBack: "2.0", clinched: false, eliminated: false,
    winPace: 86, pythagWins: 80,
  };

  it("flags clinched and eliminated teams first", () => {
    expect(computeVerdict({ ...base, clinched: true }).headline).toBe("Postseason bound");
    expect(computeVerdict({ ...base, eliminated: true }).headline).toBe("Eliminated");
  });

  it("recognises division leaders and wild-card holders", () => {
    expect(computeVerdict({ ...base, divisionRank: 1, gamesBack: "-" }).tone).toBe("good");
    expect(computeVerdict({ ...base, wildCardGamesBack: "+1.5" }).headline).toBe("In playoff position");
  });

  it("separates the bubble from long shots", () => {
    expect(computeVerdict(base).tone).toBe("bubble");
    expect(computeVerdict({ ...base, wildCardGamesBack: "8.0" }).tone).toBe("bad");
  });

  it("calls out luck when record and run differential disagree", () => {
    expect(computeVerdict({ ...base, pythagWins: 74 }).detail).toContain("6 more games");
    expect(computeVerdict({ ...base, pythagWins: 85 }).detail).toContain("5 games unlucky");
    expect(computeVerdict({ ...base, pythagWins: 81 }).detail).not.toContain("run differential");
  });
});

describe("helpers", () => {
  it("parses games-back strings", () => {
    expect(parseGamesBack("-")).toBe(0);
    expect(parseGamesBack("3.5")).toBe(3.5);
    expect(parseGamesBack("+2.0")).toBe(2);
    expect(parseGamesBack(null)).toBeNull();
  });

  it("uses last year's season before March", () => {
    expect(currentMlbSeason(new Date(2026, 1, 15))).toBe("2025");
    expect(currentMlbSeason(new Date(2026, 8, 26))).toBe("2026");
  });

  it("formats ordinals", () => {
    expect([1, 2, 3, 4, 11, 12, 13, 21, 22, 30].map(ordinal)).toEqual([
      "1st", "2nd", "3rd", "4th", "11th", "12th", "13th", "21st", "22nd", "30th",
    ]);
  });
});

describe("pulseNugget", () => {
  const pulse = buildSeasonPulse(MARINERS, "2026", STANDINGS, HITTING, PITCHING)!;

  it("highlights the team's most extreme MLB rank when record matches runs", () => {
    const nugget = pulseNugget(pulse)!;
    expect(nugget.title).toMatch(/in MLB$/);
    expect(nugget.body).toContain("Seattle Mariners");
  });

  it("calls out a gap between actual and expected record", () => {
    const nugget = pulseNugget({ ...pulse, pythagWins: 82, pythagLosses: 76 })!;
    expect(nugget.title).toBe("Better than their record");
    expect(nugget.body).toContain("6 wins below");
  });

  it("returns null with nothing to say", () => {
    expect(pulseNugget({ ...pulse, pythagWins: null, ranks: [] })).toBeNull();
  });
});
