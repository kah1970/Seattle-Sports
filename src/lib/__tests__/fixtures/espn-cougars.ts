/**
 * Trimmed-down real ESPN responses for the WSU Cougars (team id 265),
 * captured 2026-09-26 from site.api.espn.com. Only the fields our parsers
 * read are kept.
 */

/** GET .../football/college-football/teams/265 */
export const COUGARS_TEAM_SUMMARY = {
  team: {
    id: "265",
    displayName: "Washington State Cougars",
    standingSummary: "1st in Pac-12",
    record: {
      items: [{ type: "total", summary: "1-2" }],
    },
  },
};

/** GET .../football/college-football/scoreboard?dates=20260926 (WSU event only) */
export const COUGARS_SCOREBOARD = {
  events: [
    {
      date: "2026-09-26T23:30Z",
      name: "Arizona Wildcats at Washington State Cougars",
      competitions: [
        {
          status: { type: { state: "pre" } },
          venue: { fullName: "Martin Stadium" },
          competitors: [
            {
              homeAway: "home",
              score: "0",
              team: { id: "265", displayName: "Washington State Cougars" },
              records: [{ summary: "1-2" }],
            },
            {
              homeAway: "away",
              score: "0",
              team: { id: "12", displayName: "Arizona Wildcats" },
              records: [{ summary: "2-1" }],
            },
          ],
        },
      ],
    },
  ],
};
