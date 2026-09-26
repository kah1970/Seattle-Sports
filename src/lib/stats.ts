/**
 * Unified stats module — fetches live player/roster/leader data from:
 *   - MLB Stats API (statsapi.mlb.com) — official, free, no key needed
 *   - ESPN unofficial API (site.api.espn.com) — free, no key needed
 *
 * All responses are cached via Next.js `next: { revalidate }` for performance.
 */

// ── Constants ──────────────────────────────────────────────────────────────

const MLB_API = "https://statsapi.mlb.com/api/v1";
const ESPN_API = "https://site.api.espn.com/apis/site/v2/sports";
const ESPN_STANDINGS_API = "https://site.api.espn.com/apis/v2/sports";

const MARINERS_MLB_ID = 136;
const SEAHAWKS_ESPN_ID = 26;
// NBA expansion — track Seattle's bid coverage via league-level NBA ESPN id
const NBA_ESPN_ID = 41; // OKC Thunder (placeholder for Sonics expansion tracking)

const CURRENT_MLB_SEASON = 2026;
const CURRENT_NFL_SEASON = 2025;

// ── Type Definitions ───────────────────────────────────────────────────────

export interface PlayerStat {
    name: string;
    position?: string;
    jerseyNumber?: string;
    stats: Record<string, string | number>;
}

export interface TeamRosterEntry {
    name: string;
    position: string;
    jerseyNumber?: string;
    status?: string;
}

export interface StatsResponse {
    team: string;
    sport: string;
    season: number;
    fetchedAt: string;
    roster?: TeamRosterEntry[];
    leaders?: { category: string; players: PlayerStat[] }[];
    error?: string;
}

// ── MLB Stats (Mariners) ───────────────────────────────────────────────────

export async function fetchMarinersRoster(): Promise<TeamRosterEntry[]> {
    const url = `${MLB_API}/teams/${MARINERS_MLB_ID}/roster?season=2026&rosterType=active`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`MLB roster API: ${res.status}`);

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return (data.roster || []).map((p: any) => ({
        name: p.person.fullName,
        position: p.position.abbreviation,
        jerseyNumber: p.jerseyNumber,
        status: p.status?.description,
    }));
}

export async function fetchMarinersLeaders(): Promise<{ category: string; players: PlayerStat[] }[]> {
    const [hittingRes, pitchingRes] = await Promise.all([
        fetch(
            `${MLB_API}/stats?stats=season&season=${CURRENT_MLB_SEASON}&group=hitting&gameType=R&teamId=${MARINERS_MLB_ID}&sportId=1&limit=10`,
            { next: { revalidate: 1800 } }
        ),
        fetch(
            `${MLB_API}/stats?stats=season&season=${CURRENT_MLB_SEASON}&group=pitching&gameType=R&teamId=${MARINERS_MLB_ID}&sportId=1&limit=10`,
            { next: { revalidate: 1800 } }
        ),
    ]);

    const results: { category: string; players: PlayerStat[] }[] = [];

    if (hittingRes.ok) {
        const data = await hittingRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const splits = data.stats?.[0]?.splits || [];
        results.push({
            category: "Batting",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            players: splits.slice(0, 10).map((s: any) => ({
                name: s.player?.fullName ?? "Unknown",
                position: s.position?.abbreviation,
                stats: {
                    AVG: s.stat?.avg ?? "-",
                    HR: s.stat?.homeRuns ?? 0,
                    RBI: s.stat?.rbi ?? 0,
                    OPS: s.stat?.ops ?? "-",
                    SB: s.stat?.stolenBases ?? 0,
                    G: s.stat?.gamesPlayed ?? 0,
                },
            })),
        });
    }

    if (pitchingRes.ok) {
        const data = await pitchingRes.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const splits = data.stats?.[0]?.splits || [];
        results.push({
            category: "Pitching",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            players: splits.slice(0, 10).map((s: any) => ({
                name: s.player?.fullName ?? "Unknown",
                position: s.position?.abbreviation ?? "P",
                stats: {
                    ERA: s.stat?.era ?? "-",
                    W: s.stat?.wins ?? 0,
                    L: s.stat?.losses ?? 0,
                    SO: s.stat?.strikeOuts ?? 0,
                    IP: s.stat?.inningsPitched ?? "-",
                    WHIP: s.stat?.whip ?? "-",
                },
            })),
        });
    }

    return results;
}

// ── NFL Stats (Seahawks via ESPN) ──────────────────────────────────────────

export async function fetchSeahawksRoster(): Promise<TeamRosterEntry[]> {
    const url = `${ESPN_API}/football/nfl/teams/${SEAHAWKS_ESPN_ID}/roster`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) throw new Error(`ESPN NFL roster API: ${res.status}`);

    const data = await res.json();
    const entries: TeamRosterEntry[] = [];

    // ESPN groups roster by position category (athletes array inside each group)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    for (const group of data.athletes || []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for (const player of group.items || []) {
            entries.push({
                name: player.fullName ?? player.displayName,
                position: player.position?.abbreviation ?? group.position ?? "N/A",
                jerseyNumber: player.jersey,
                status: player.injuries?.[0]?.status,
            });
        }
    }
    return entries;
}

export async function fetchSeahawksStats(): Promise<{ category: string; players: PlayerStat[] }[]> {
    // ESPN team stats summary for 2025 season
    const url = `${ESPN_API}/football/nfl/teams/${SEAHAWKS_ESPN_ID}?enable=roster,stats,record`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const data = await res.json();
    const team = data.team;
    if (!team) return [];

    // Build a basic team summary stat block from ESPN's record data
    const record = team.record?.items?.[0]?.summary ?? "N/A";
    return [
        {
            category: "Team Record (2025)",
            players: [
                {
                    name: "Seattle Seahawks",
                    stats: {
                        "W-L": record,
                        "Conference": team.record?.items?.[1]?.summary ?? "N/A",
                    },
                },
            ],
        },
    ];
}

// ── NBA — SuperSonics expansion tracking ──────────────────────────────────

export async function fetchSonicsExpansionNews(): Promise<{ headline: string; summary: string; link?: string }[]> {
    // ESPN NBA news for Seattle/Sonics expansion is surfaced via general NBA scoreboard + search
    // We use the ESPN news endpoint for "seattle supersonics" keyword
    const url = `${ESPN_API}/basketball/nba/news?limit=5`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return [];

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const items: { headline: string; summary: string; link?: string }[] = (data.articles || [])
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .filter((a: any) =>
            (a.headline + " " + (a.description ?? "")).toLowerCase().includes("seattle") ||
            (a.headline + " " + (a.description ?? "")).toLowerCase().includes("expansion")
        )
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .map((a: any) => ({
            headline: a.headline,
            summary: a.description ?? "",
            link: a.links?.web?.href,
        }));

    return items;
}

// ── Convenience: fetch everything for a team in parallel ──────────────────

export async function fetchTeamStats(teamSlug: string): Promise<StatsResponse> {
    const now = new Date().toISOString();

    try {
        if (teamSlug === "mariners") {
            const [roster, leaders] = await Promise.all([
                fetchMarinersRoster().catch(() => [] as TeamRosterEntry[]),
                fetchMarinersLeaders().catch(() => []),
            ]);
            return { team: teamSlug, sport: "MLB", season: CURRENT_MLB_SEASON, fetchedAt: now, roster, leaders };
        }

        if (teamSlug === "seahawks") {
            const [roster, leaders] = await Promise.all([
                fetchSeahawksRoster().catch(() => [] as TeamRosterEntry[]),
                fetchSeahawksStats().catch(() => []),
            ]);
            return { team: teamSlug, sport: "NFL", season: CURRENT_NFL_SEASON, fetchedAt: now, roster, leaders };
        }

        if (teamSlug === "supersonics") {
            return {
                team: teamSlug,
                sport: "NBA",
                season: 2026,
                fetchedAt: now,
                roster: [],
                leaders: [
                    {
                        category: "Expansion Status",
                        players: [
                            {
                                name: "Seattle SuperSonics Bid",
                                stats: {
                                    "Bid Status": "Formal bid submitted (Feb 2026)",
                                    "Arena": "Climate Pledge Arena (NBA-ready)",
                                    "Decision Expected": "2026-2027",
                                },
                            },
                        ],
                    },
                ],
            };
        }

        return { team: teamSlug, sport: "unknown", season: 2026, fetchedAt: now, error: `Unknown team: ${teamSlug}` };
    } catch (err) {
        return {
            team: teamSlug,
            sport: "unknown",
            season: 2026,
            fetchedAt: now,
            error: err instanceof Error ? err.message : "Unknown error",
        };
    }
}

// ── Today's Game ──────────────────────────────────────────────────────────

export interface TodaysGameData {
    found: boolean;
    isToday: boolean;
    gameDate: string;
    opponent: string;
    isHome: boolean;
    venue: string;
    status: "scheduled" | "live" | "final";
    homeScore?: number;
    awayScore?: number;
    probablePitcherHome?: { name: string; era: string; record: string };
    probablePitcherAway?: { name: string; era: string; record: string };
    teamRecord?: string;
    opponentRecord?: string;
    streak?: string;
    broadcast?: string;
}

export async function fetchTodaysGame(teamSlug: string): Promise<TodaysGameData | null> {
    if (teamSlug === "mariners") return fetchTodaysGameMLB();
    if (teamSlug === "seahawks") return fetchTodaysGameESPN("football/nfl", SEAHAWKS_ESPN_ID, "seahawks");
    return null;
}

async function fetchTodaysGameMLB(): Promise<TodaysGameData | null> {
    const today = new Date().toISOString().split("T")[0];
    // Fetch today + next 7 days to find today's game or next upcoming
    const end = new Date(Date.now() + 7 * 86400000).toISOString().split("T")[0];
    const url = `${MLB_API}/schedule?sportId=1&teamId=${MARINERS_MLB_ID}&startDate=${today}&endDate=${end}&hydrate=probablePitcher,team,venue,linescore`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allGames: any[] = [];
    for (const dateEntry of data.dates || []) {
        for (const game of dateEntry.games || []) {
            allGames.push(game);
        }
    }
    if (allGames.length === 0) return null;

    // Find today's game first, otherwise next upcoming
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let game = allGames.find((g: any) => g.gameDate?.startsWith(today));
    const isToday = !!game;
    if (!game) game = allGames[0];

    const isHome = game.teams?.home?.team?.name === "Seattle Mariners";
    const opp = isHome ? game.teams?.away : game.teams?.home;
    const team = isHome ? game.teams?.home : game.teams?.away;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const mapPitcher = (p: any) => {
        if (!p) return undefined;
        return {
            name: p.fullName ?? "TBD",
            era: p.pitchHand ? "" : "", // ERA comes from stats hydration
            record: "",
        };
    };

    const statusMap: Record<string, "scheduled" | "live" | "final"> = {
        "Preview": "scheduled", "Scheduled": "scheduled", "Pre-Game": "scheduled",
        "Live": "live", "In Progress": "live",
        "Final": "final", "Game Over": "final",
    };

    return {
        found: true,
        isToday,
        gameDate: game.gameDate,
        opponent: opp?.team?.name ?? "TBD",
        isHome,
        venue: game.venue?.name ?? "",
        status: statusMap[game.status?.abstractGameState] ?? statusMap[game.status?.detailedState] ?? "scheduled",
        homeScore: game.teams?.home?.score,
        awayScore: game.teams?.away?.score,
        probablePitcherHome: mapPitcher(game.teams?.home?.probablePitcher),
        probablePitcherAway: mapPitcher(game.teams?.away?.probablePitcher),
        teamRecord: `${team?.leagueRecord?.wins ?? 0}-${team?.leagueRecord?.losses ?? 0}`,
        opponentRecord: `${opp?.leagueRecord?.wins ?? 0}-${opp?.leagueRecord?.losses ?? 0}`,
    };
}

async function fetchTodaysGameESPN(sport: string, teamId: number, teamSlug: string): Promise<TodaysGameData | null> {
    const today = new Date().toISOString().split("T")[0].replace(/-/g, "");
    // Check today's scoreboard
    const url = `${ESPN_API}/${sport}/scoreboard?dates=${today}`;
    const res = await fetch(url, { next: { revalidate: 300 } });
    if (!res.ok) return null;

    const data = await res.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const events = data.events || [];

    // Find our team's game
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let event = events.find((e: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        e.competitions?.[0]?.competitors?.some((c: any) => c.team?.id === String(teamId))
    );

    let isToday = !!event;

    // If no game today, try to get next from schedule
    if (!event) {
        const schedUrl = `${ESPN_API}/${sport}/teams/${teamId}/schedule?season=${CURRENT_NFL_SEASON}`;
        const schedRes = await fetch(schedUrl, { next: { revalidate: 3600 } });
        if (!schedRes.ok) return null;
        const schedData = await schedRes.json();
        const now = new Date();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        event = (schedData.events || []).find((e: any) => new Date(e.date) > now);
        isToday = false;
        if (!event) return null;
    }

    const comp = event.competitions?.[0];
    if (!comp) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const ourTeam = comp.competitors?.find((c: any) => c.team?.id === String(teamId));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const oppTeam = comp.competitors?.find((c: any) => c.team?.id !== String(teamId));

    const statusState = comp.status?.type?.state;
    const status: "scheduled" | "live" | "final" = statusState === "post" ? "final" : statusState === "in" ? "live" : "scheduled";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const homeComp = comp.competitors?.find((c: any) => c.homeAway === "home");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const awayComp = comp.competitors?.find((c: any) => c.homeAway === "away");

    return {
        found: true,
        isToday,
        gameDate: event.date,
        opponent: oppTeam?.team?.displayName ?? "TBD",
        isHome: ourTeam?.homeAway === "home",
        venue: comp.venue?.fullName ?? "",
        status,
        homeScore: homeComp?.score ? Number(homeComp.score) : undefined,
        awayScore: awayComp?.score ? Number(awayComp.score) : undefined,
        teamRecord: ourTeam?.records?.[0]?.summary,
        opponentRecord: oppTeam?.records?.[0]?.summary,
    };
}

// ── Division Standings ────────────────────────────────────────────────────

export interface StandingsTeam {
    rank: number;
    name: string;
    shortName: string;
    wins: number;
    losses: number;
    pct: string;
    gamesBack: string;
    streak: string;
    last10: string;
    isCurrentTeam: boolean;
}

export interface StandingsData {
    divisionName: string;
    teams: StandingsTeam[];
}

export async function fetchDivisionStandings(teamSlug: string): Promise<StandingsData | null> {
    if (teamSlug === "mariners") return fetchMLBStandings();
    if (teamSlug === "seahawks") return fetchNFLStandings();
    return null;
}

async function fetchMLBStandings(): Promise<StandingsData | null> {
    const url = `${MLB_API}/standings?leagueId=103&season=${CURRENT_MLB_SEASON}&standingsTypes=regularSeason&hydrate=team`;
    const res = await fetch(url, { next: { revalidate: 1800 } });
    if (!res.ok) return null;

    const data = await res.json();
    // Find AL West division (Mariners' division)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const records = data.records || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const alWest = records.find((r: any) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        r.teamRecords?.some((tr: any) => tr.team?.name === "Seattle Mariners")
    );
    if (!alWest) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams: StandingsTeam[] = (alWest.teamRecords || []).map((tr: any, i: number) => {
        const streak = tr.streak?.streakCode ?? "-";
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const last10Split = (tr.records?.splitRecords || []).find((s: any) => s.type === "lastTen");
        const last10 = last10Split ? `${last10Split.wins}-${last10Split.losses}` : "-";

        return {
            rank: i + 1,
            name: tr.team?.name ?? "Unknown",
            shortName: tr.team?.teamName ?? tr.team?.name?.split(" ").pop() ?? "Unknown",
            wins: tr.wins ?? 0,
            losses: tr.losses ?? 0,
            pct: tr.winningPercentage ?? ".000",
            gamesBack: tr.gamesBack ?? "-",
            streak,
            last10,
            isCurrentTeam: tr.team?.name === "Seattle Mariners",
        };
    });

    return { divisionName: "AL West", teams };
}

async function fetchNFLStandings(): Promise<StandingsData | null> {
    const url = `${ESPN_STANDINGS_API}/football/nfl/standings`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;

    const data = await res.json();
    // Navigate ESPN structure: children = conferences, children.children = divisions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conferences = data.children || [];
    let nfcWest = null;

    for (const conf of conferences) {
        for (const div of conf.children || []) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const hasSeahawks = (div.standings?.entries || []).some((e: any) =>
                e.team?.displayName === "Seattle Seahawks"
            );
            if (hasSeahawks) {
                nfcWest = div;
                break;
            }
        }
        if (nfcWest) break;
    }

    if (!nfcWest) return null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const teams: StandingsTeam[] = (nfcWest.standings?.entries || []).map((entry: any, i: number) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const getStat = (name: string) => entry.stats?.find((s: any) => s.name === name)?.displayValue ?? "-";

        return {
            rank: i + 1,
            name: entry.team?.displayName ?? "Unknown",
            shortName: entry.team?.shortDisplayName ?? "Unknown",
            wins: Number(getStat("wins")) || 0,
            losses: Number(getStat("losses")) || 0,
            pct: getStat("winPercent"),
            gamesBack: getStat("gamesBehind"),
            streak: getStat("streak"),
            last10: "-",
            isCurrentTeam: entry.team?.displayName === "Seattle Seahawks",
        };
    });

    return { divisionName: nfcWest.name ?? "NFC West", teams };
}
