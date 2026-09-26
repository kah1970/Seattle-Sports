import { describe, it, expect } from "vitest";
import { getDailyStatNugget, getAllDailyNuggets } from "../analytics/stat-nuggets";

describe("getDailyStatNugget", () => {
  it("returns a nugget for each team", () => {
    expect(getDailyStatNugget("mariners")).not.toBeNull();
    expect(getDailyStatNugget("seahawks")).not.toBeNull();
    expect(getDailyStatNugget("supersonics")).not.toBeNull();
  });

  it("returns null for unknown teams", () => {
    expect(getDailyStatNugget("unknown")).toBeNull();
  });

  it("returns consistent results for the same day", () => {
    const nugget1 = getDailyStatNugget("mariners");
    const nugget2 = getDailyStatNugget("mariners");
    expect(nugget1).toEqual(nugget2);
  });

  it("includes required fields", () => {
    const nugget = getDailyStatNugget("mariners");
    expect(nugget).toHaveProperty("title");
    expect(nugget).toHaveProperty("body");
    expect(nugget).toHaveProperty("category");
    expect(nugget).toHaveProperty("teamSlug", "mariners");
    expect(nugget).toHaveProperty("sport", "MLB");
  });
});

describe("getAllDailyNuggets", () => {
  it("returns nuggets for every team", () => {
    const nuggets = getAllDailyNuggets();
    expect(nuggets).toHaveLength(4);
    const teamSlugs = nuggets.map((n) => n.teamSlug).sort();
    expect(teamSlugs).toEqual(["cougars", "mariners", "seahawks", "supersonics"]);
  });
});
