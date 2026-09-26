import {
  buildSeasonPulse,
  currentMlbSeason,
  RawStandingsResponse,
  RawTeamStatsResponse,
  SeasonPulse,
} from "@/lib/analytics/season-pulse";

/**
 * Fetches live standings and league-wide team stats from the public
 * MLB Stats API and builds a Season Pulse for one team.
 * Returns null (never throws) when the API is unreachable, so the team
 * page still renders without it.
 */
const MLB_API_BASE =
  process.env.MLB_STATS_API_BASE || "https://statsapi.mlb.com/api/v1";
const AMERICAN_LEAGUE_ID = 103;
const NATIONAL_LEAGUE_ID = 104;

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${MLB_API_BASE}${path}`, {
    next: { revalidate: 900 }, // standings move at most a few times a day
  });
  if (!res.ok) throw new Error(`MLB API ${path} returned ${res.status}`);
  return res.json() as Promise<T>;
}

export async function fetchSeasonPulse(
  teamId: number
): Promise<SeasonPulse | null> {
  const season = currentMlbSeason();
  try {
    const [standings, hitting, pitching] = await Promise.all([
      getJson<RawStandingsResponse>(
        `/standings?leagueId=${AMERICAN_LEAGUE_ID},${NATIONAL_LEAGUE_ID}&season=${season}&standingsTypes=regularSeason&hydrate=team,division`
      ),
      getJson<RawTeamStatsResponse>(
        `/teams/stats?season=${season}&sportIds=1&group=hitting&stats=season`
      ).catch(() => undefined),
      getJson<RawTeamStatsResponse>(
        `/teams/stats?season=${season}&sportIds=1&group=pitching&stats=season`
      ).catch(() => undefined),
    ]);
    return buildSeasonPulse(teamId, season, standings, hitting, pitching);
  } catch (error) {
    console.error("[SeasonPulse] Could not load season data:", error);
    return null;
  }
}
