import type {
  RawStandingsResponse,
  RawTeamStatsResponse,
} from "../../analytics/season-pulse";

/** Trimmed-down MLB Stats API responses: a sub-.500 Mariners team. */
export const STANDINGS: RawStandingsResponse = {
  records: [
    {
      division: { id: 200, name: "American League West" },
      teamRecords: [
        {
          team: { id: 117, name: "Houston Astros" },
          wins: 88, losses: 70, divisionRank: "1", gamesBack: "-", wildCardGamesBack: "-",
        },
        {
          team: { id: 136, name: "Seattle Mariners" },
          wins: 76,
          losses: 82,
          winningPercentage: ".481",
          divisionRank: "3",
          gamesBack: "12.0",
          wildCardGamesBack: "6.5",
          runsScored: 640,
          runsAllowed: 660,
          runDifferential: -20,
          streak: { streakCode: "L3" },
          clinched: false,
          eliminationNumber: "E",
          wildCardEliminationNumber: "2",
          records: {
            splitRecords: [
              { type: "home", wins: 40, losses: 39 },
              { type: "lastTen", wins: 3, losses: 7 },
            ],
          },
        },
      ],
    },
  ],
};

const teams = [
  { id: 136, runs: 640, ops: ".680", homeRuns: 170, era: "4.10", whip: "1.28" },
  { id: 117, runs: 720, ops: ".740", homeRuns: 190, era: "3.80", whip: "1.20" },
  { id: 147, runs: 780, ops: ".770", homeRuns: 230, era: "4.30", whip: "1.30" },
  { id: 111, runs: 600, ops: ".660", homeRuns: 150, era: "3.60", whip: "1.18" },
];

export const HITTING: RawTeamStatsResponse = {
  stats: [
    {
      splits: teams.map((t) => ({
        team: { id: t.id },
        stat: { runs: t.runs, ops: t.ops, homeRuns: t.homeRuns },
      })),
    },
  ],
};

export const PITCHING: RawTeamStatsResponse = {
  stats: [
    {
      splits: teams.map((t) => ({
        team: { id: t.id },
        stat: { era: t.era, whip: t.whip },
      })),
    },
  ],
};
