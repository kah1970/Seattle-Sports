import { describe, it, expect } from "vitest";
import { currentNflSeason, parseEspnSeasonSummary } from "../stats";

describe("currentNflSeason", () => {
  it("rolls over in September", () => {
    expect(currentNflSeason(new Date(2026, 8, 26))).toBe(2026);
    expect(currentNflSeason(new Date(2026, 7, 20))).toBe(2025); // preseason
    expect(currentNflSeason(new Date(2026, 1, 8))).toBe(2025); // Super Bowl
  });
});

describe("parseEspnSeasonSummary", () => {
  it("reads the overall record and standing", () => {
    const data = {
      team: {
        standingSummary: "1st in NFC West",
        record: {
          items: [
            { type: "total", summary: "3-0" },
            { type: "home", summary: "2-0" },
          ],
        },
      },
    };
    expect(parseEspnSeasonSummary(data, 2026)).toEqual({
      season: 2026,
      record: "3-0",
      standing: "1st in NFC West",
    });
  });

  it("returns null without a record", () => {
    expect(parseEspnSeasonSummary({ team: {} }, 2026)).toBeNull();
    expect(parseEspnSeasonSummary(null, 2026)).toBeNull();
  });
});
