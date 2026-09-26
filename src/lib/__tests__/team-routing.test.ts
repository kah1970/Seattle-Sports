import { describe, it, expect } from "vitest";
import { mentionsTeam, routeArticle } from "../sources/rss-adapter";

const crossTeam = {
  teamSlug: "mariners",
  teamSlugs: ["mariners", "seahawks", "supersonics", "cougars"],
  requireTeamMatch: true,
};

describe("mentionsTeam", () => {
  it("matches whole words only", () => {
    expect(mentionsTeam("Mariners walk off in the 10th", "mariners")).toBe(true);
    expect(mentionsTeam("Atlanta Hawks beat the Thunder", "seahawks")).toBe(false);
    expect(mentionsTeam("Atlanta Hawks beat the Thunder", "supersonics")).toBe(false);
    expect(mentionsTeam("Walker Buehler signs with Boston", "seahawks")).toBe(false);
    expect(mentionsTeam("Sam Darnold throws for 300 yards", "seahawks")).toBe(true);
    expect(mentionsTeam("Kenneth Walker runs wild for the Chiefs", "seahawks")).toBe(false);
  });

  it("does not match keywords inside longer words", () => {
    expect(mentionsTeam("A discouraging night for the offense", "cougars")).toBe(false);
    expect(mentionsTeam("Cougs open Pac-12 play", "cougars")).toBe(true);
  });
});

describe("routeArticle", () => {
  it("drops cross-team articles that mention no Seattle team", () => {
    expect(
      routeArticle(
        "No end in sight for eligibility, contract battles in college sports",
        "Without federal legislation codifying rules on athlete compensation...",
        crossTeam
      )
    ).toEqual([]);
  });

  it("files a cross-team article under every team it mentions", () => {
    expect(
      routeArticle("Seahawks and Mariners both win on Sunday", "", crossTeam)
    ).toEqual(["mariners", "seahawks"]);
    expect(routeArticle("Washington State edges Oregon State", "", crossTeam)).toEqual(["cougars"]);
  });

  it("keeps a league-wide feed's article only if it mentions that team", () => {
    const espnMlb = { teamSlug: "mariners", requireTeamMatch: true };
    expect(routeArticle("Seahawks sign a linebacker", "", espnMlb)).toEqual([]);
    expect(routeArticle("Cal Raleigh hits No. 40", "", espnMlb)).toEqual(["mariners"]);
  });

  it("keeps everything from a team-specific feed", () => {
    expect(routeArticle("Bullpen notes", "", { teamSlug: "mariners" })).toEqual(["mariners"]);
  });
});
