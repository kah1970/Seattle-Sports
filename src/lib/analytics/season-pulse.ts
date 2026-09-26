/**
 * Season Pulse: turns MLB Stats API standings + league-wide team stats
 * into a compact "how is the season going" summary for a team page.
 *
 * Parsing is kept pure (no fetch) so it can be unit tested with fixtures.
 * Every field from the API is treated as optional — a missing field
 * degrades that stat to null rather than breaking the page.
 */

export const MLB_SEASON_GAMES = 162;

export type PulseTone = "good" | "bubble" | "bad";

export interface LeagueRank {
  label: string;
  value: string;
  rank: number; // 1 = best in MLB
  of: number;
}

export interface SeasonPulse {
  season: string;
  teamName: string;
  division: string | null;
  wins: number;
  losses: number;
  winPct: number;
  divisionRank: number | null;
  gamesBack: string | null;
  wildCardGamesBack: string | null;
  lastTen: string | null;
  streak: string | null;
  runsScored: number | null;
  runsAllowed: number | null;
  runDifferential: number | null;
  pythagWins: number | null;
  pythagLosses: number | null;
  winPace: number;
  clinched: boolean;
  eliminated: boolean;
  ranks: LeagueRank[];
  verdict: { tone: PulseTone; headline: string; detail: string };
}

// ---- Raw API shapes (only the fields we read) ----

interface RawSplitRecord {
  type?: string;
  wins?: number;
  losses?: number;
}

interface RawTeamRecord {
  team?: { id?: number; name?: string };
  wins?: number;
  losses?: number;
  winningPercentage?: string;
  divisionRank?: string;
  gamesBack?: string;
  wildCardGamesBack?: string;
  runsScored?: number;
  runsAllowed?: number;
  runDifferential?: number;
  streak?: { streakCode?: string };
  clinched?: boolean;
  eliminationNumber?: string;
  wildCardEliminationNumber?: string;
  records?: { splitRecords?: RawSplitRecord[] };
}

export interface RawStandingsResponse {
  records?: Array<{
    division?: { id?: number; name?: string };
    teamRecords?: RawTeamRecord[];
  }>;
}

export interface RawTeamStatsResponse {
  stats?: Array<{
    splits?: Array<{
      team?: { id?: number; name?: string };
      stat?: Record<string, string | number | undefined>;
    }>;
  }>;
}

/**
 * The MLB season runs roughly March–October. In January/February the
 * "current" season is still last year's.
 */
export function currentMlbSeason(now: Date = new Date()): string {
  const year = now.getFullYear();
  return String(now.getMonth() < 2 ? year - 1 : year);
}

export function buildSeasonPulse(
  teamId: number,
  season: string,
  standings: RawStandingsResponse,
  hitting?: RawTeamStatsResponse,
  pitching?: RawTeamStatsResponse
): SeasonPulse | null {
  let record: RawTeamRecord | undefined;
  let division: string | null = null;
  for (const div of standings.records || []) {
    const match = (div.teamRecords || []).find((r) => r.team?.id === teamId);
    if (match) {
      record = match;
      division = div.division?.name ?? null;
      break;
    }
  }
  if (!record || record.wins === undefined || record.losses === undefined) {
    return null;
  }

  const wins = record.wins;
  const losses = record.losses;
  const games = wins + losses;
  const winPct = games > 0 ? wins / games : 0;

  const lastTenSplit = record.records?.splitRecords?.find(
    (s) => s.type === "lastTen"
  );
  const lastTen =
    lastTenSplit?.wins !== undefined && lastTenSplit?.losses !== undefined
      ? `${lastTenSplit.wins}-${lastTenSplit.losses}`
      : null;

  const runsScored = record.runsScored ?? null;
  const runsAllowed = record.runsAllowed ?? null;
  const runDifferential =
    record.runDifferential ??
    (runsScored !== null && runsAllowed !== null
      ? runsScored - runsAllowed
      : null);

  let pythagWins: number | null = null;
  let pythagLosses: number | null = null;
  if (runsScored && runsAllowed && games > 0) {
    // Pythagorean expectation with the standard 1.83 exponent
    const exp = 1.83;
    const pct =
      runsScored ** exp / (runsScored ** exp + runsAllowed ** exp);
    pythagWins = Math.round(pct * games);
    pythagLosses = games - pythagWins;
  }

  const divisionRank = record.divisionRank
    ? parseInt(record.divisionRank, 10) || null
    : null;
  const eliminated =
    record.eliminationNumber === "E" &&
    record.wildCardEliminationNumber === "E";

  const pulse: SeasonPulse = {
    season,
    teamName: record.team?.name ?? "",
    division,
    wins,
    losses,
    winPct,
    divisionRank,
    gamesBack: record.gamesBack ?? null,
    wildCardGamesBack: record.wildCardGamesBack ?? null,
    lastTen,
    streak: record.streak?.streakCode ?? null,
    runsScored,
    runsAllowed,
    runDifferential,
    pythagWins,
    pythagLosses,
    winPace: Math.round(winPct * MLB_SEASON_GAMES),
    clinched: record.clinched === true,
    eliminated,
    ranks: [
      ...(hitting ? buildHittingRanks(teamId, hitting) : []),
      ...(pitching ? buildPitchingRanks(teamId, pitching) : []),
    ],
    verdict: { tone: "bubble", headline: "", detail: "" },
  };
  pulse.verdict = computeVerdict(pulse);
  return pulse;
}

/** Parses "3.5" / "-" / "+2.0" style games-back strings. "-" means leading. */
export function parseGamesBack(gb: string | null): number | null {
  if (gb === null) return null;
  if (gb.trim() === "-") return 0;
  const n = parseFloat(gb);
  return Number.isNaN(n) ? null : n;
}

export function computeVerdict(
  p: Pick<
    SeasonPulse,
    | "wins"
    | "losses"
    | "divisionRank"
    | "gamesBack"
    | "wildCardGamesBack"
    | "clinched"
    | "eliminated"
    | "winPace"
    | "pythagWins"
  >
): SeasonPulse["verdict"] {
  const luck =
    p.pythagWins !== null ? p.wins - p.pythagWins : null;
  const luckNote =
    luck === null || Math.abs(luck) < 3
      ? ""
      : luck > 0
        ? ` Their run differential says they've won ${luck} more games than they've earned.`
        : ` Their run differential says they've been ${-luck} games unlucky.`;

  if (p.clinched) {
    return {
      tone: "good",
      headline: "Postseason bound",
      detail: `Clinched a playoff spot at ${p.wins}-${p.losses}.${luckNote}`,
    };
  }
  if (p.eliminated) {
    return {
      tone: "bad",
      headline: "Eliminated",
      detail: `Out of postseason contention at ${p.wins}-${p.losses}.${luckNote}`,
    };
  }

  const divGb = parseGamesBack(p.gamesBack);
  const wcGb = parseGamesBack(p.wildCardGamesBack);
  // The API reports wild-card GB as "+N" for teams holding a spot.
  const holdsWildCard =
    p.wildCardGamesBack !== null &&
    (p.wildCardGamesBack.startsWith("+") || wcGb === 0);

  if (p.divisionRank === 1 || divGb === 0) {
    return {
      tone: "good",
      headline: "Leading the division",
      detail: `On pace for ${p.winPace} wins.${luckNote}`,
    };
  }
  if (holdsWildCard) {
    return {
      tone: "good",
      headline: "In playoff position",
      detail: `Holding a wild-card spot, on pace for ${p.winPace} wins.${luckNote}`,
    };
  }
  if (wcGb !== null && wcGb <= 4) {
    return {
      tone: "bubble",
      headline: "On the bubble",
      detail: `${wcGb} games out of a wild-card spot, on pace for ${p.winPace} wins.${luckNote}`,
    };
  }
  return {
    tone: "bad",
    headline: "Season slipping away",
    detail: `${wcGb ?? "?"} games out of a wild-card spot, on pace for ${p.winPace} wins.${luckNote}`,
  };
}

type StatSpec = {
  key: string;
  label: string;
  higherIsBetter: boolean;
  format: (v: number) => string;
};

const HITTING_SPECS: StatSpec[] = [
  { key: "runs", label: "Runs scored", higherIsBetter: true, format: (v) => String(v) },
  { key: "ops", label: "OPS", higherIsBetter: true, format: (v) => v.toFixed(3).replace(/^0/, "") },
  { key: "homeRuns", label: "Home runs", higherIsBetter: true, format: (v) => String(v) },
];

const PITCHING_SPECS: StatSpec[] = [
  { key: "era", label: "Team ERA", higherIsBetter: false, format: (v) => v.toFixed(2) },
  { key: "whip", label: "WHIP", higherIsBetter: false, format: (v) => v.toFixed(2) },
];

function buildHittingRanks(teamId: number, res: RawTeamStatsResponse) {
  return buildRanks(teamId, res, HITTING_SPECS);
}

function buildPitchingRanks(teamId: number, res: RawTeamStatsResponse) {
  return buildRanks(teamId, res, PITCHING_SPECS);
}

/**
 * Ranks a team among all MLB teams for each stat. Ties share the better rank.
 */
export function buildRanks(
  teamId: number,
  res: RawTeamStatsResponse,
  specs: StatSpec[]
): LeagueRank[] {
  const splits = res.stats?.[0]?.splits || [];
  const ranks: LeagueRank[] = [];

  for (const spec of specs) {
    const values: { id: number | undefined; v: number }[] = [];
    for (const s of splits) {
      const raw = s.stat?.[spec.key];
      const v = typeof raw === "number" ? raw : parseFloat(String(raw));
      if (!Number.isNaN(v)) values.push({ id: s.team?.id, v });
    }
    const mine = values.find((x) => x.id === teamId);
    if (!mine) continue;

    const better = values.filter((x) =>
      spec.higherIsBetter ? x.v > mine.v : x.v < mine.v
    ).length;
    ranks.push({
      label: spec.label,
      value: spec.format(mine.v),
      rank: better + 1,
      of: values.length,
    });
  }
  return ranks;
}

export function ordinal(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

export function shortDivision(name: string): string {
  return name.replace("American League", "AL").replace("National League", "NL");
}

/**
 * A "Stat of the Day" drawn from live season data instead of a fixed list.
 * Prefers the most telling fact: a big gap between the actual and expected
 * record, otherwise the team's best or worst MLB rank.
 */
export function pulseNugget(
  p: SeasonPulse
): { title: string; body: string; category: "trend" | "comparison" } | null {
  if (p.pythagWins !== null && p.pythagLosses !== null) {
    const luck = p.wins - p.pythagWins;
    if (Math.abs(luck) >= 3) {
      return {
        title: luck > 0 ? "Winning more than they should" : "Better than their record",
        body: `${p.teamName || "The team"} ${p.teamName ? "are" : "is"} ${p.wins}-${p.losses}, but their ${p.runsScored} runs scored and ${p.runsAllowed} allowed point to ${p.pythagWins}-${p.pythagLosses}. That's ${Math.abs(luck)} wins ${luck > 0 ? "above" : "below"} what their run differential predicts.`,
        category: "comparison",
      };
    }
  }

  if (p.ranks.length === 0) return null;
  // The rank furthest from the middle of the league is the most notable.
  const extreme = [...p.ranks].sort(
    (a, b) => Math.abs(b.rank - (b.of + 1) / 2) - Math.abs(a.rank - (a.of + 1) / 2)
  )[0];
  const good = extreme.rank <= extreme.of / 2;
  return {
    title: `${extreme.label}: ${ordinal(extreme.rank)} in MLB`,
    body: `${p.teamName ? `The ${p.teamName}'` : "The team's"} ${extreme.label} (${extreme.value}) ranks ${ordinal(extreme.rank)} of ${extreme.of} teams this season, ${good ? "one of the team's strengths" : "one of the biggest reasons for their record"}.`,
    category: "trend",
  };
}
