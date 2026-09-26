"use client";

import { useState } from "react";

type League = "mlb" | "nba" | "nfl" | "ncaam";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GameData = any;

interface MLBPlayerInfo {
    id: number;
    name: string;
    position: string;
    team: string;
    isPitcher: boolean;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface MLBResponse { player: MLBPlayerInfo; season: string; seasonTotals: any; data: GameData[] }

export function PlayerSearchClient() {
    const [league, setLeague] = useState<League>("mlb");
    const [playerName, setPlayerName] = useState("");
    const [season, setSeason] = useState("2026");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<GameData[] | null>(null);
    const [mlbPlayer, setMlbPlayer] = useState<MLBPlayerInfo | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [mlbTotals, setMlbTotals] = useState<any>(null);
    const [viewMode, setViewMode] = useState<"gamelog" | "raw">("gamelog");
    const [filterDate, setFilterDate] = useState("");
    const [shotChartUrl, setShotChartUrl] = useState<string | null>(null);
    const [chartLoadingGameId, setChartLoadingGameId] = useState<string | null>(null);

    const isMLB = league === "mlb";

    const handleGenerateShotChart = async (gameId: string) => {
        setChartLoadingGameId(gameId);
        setShotChartUrl(null);
        setError(null);

        try {
            const res = await fetch("/api/stats/player", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    league,
                    endpoint: "hexmap",
                    payload: { playerName, season, seasonType: "Regular Season", gameId },
                }),
            });

            const json = await res.json();
            if (!res.ok) throw new Error(json.error || `Error ${res.status}`);
            setShotChartUrl(json.imageUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load shot chart");
        } finally {
            setChartLoadingGameId(null);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName || !season) return;

        setLoading(true);
        setError(null);
        setData(null);
        setMlbPlayer(null);
        setMlbTotals(null);

        try {
            if (isMLB) {
                // MLB goes direct to MLB Stats API
                const res = await fetch("/api/stats/player", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        league: "mlb",
                        endpoint: "gameLog",
                        payload: { playerName, season },
                    }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

                const mlbRes = json as MLBResponse;
                setMlbPlayer(mlbRes.player);
                setMlbTotals(mlbRes.seasonTotals);
                setData(mlbRes.data);
            } else {
                // NBA/NFL/NCAAM go through Flask proxy
                const endpoint = league === "nba" ? "perSeasonStats" : "seasonStats";
                const res = await fetch("/api/stats/player", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        league,
                        endpoint,
                        payload: { playerName, season, seasonType: "Regular Season" },
                    }),
                });
                const json = await res.json();
                if (!res.ok) throw new Error(json.error || `Error ${res.status}`);

                const responseData = Array.isArray(json) ? json : json.data;
                setData(responseData);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Season placeholder based on league
    const seasonPlaceholder = isMLB ? "2026" : "2025-26";

    // When switching leagues, update season format
    const handleLeagueChange = (newLeague: League) => {
        setLeague(newLeague);
        if (newLeague === "mlb" && season.includes("-")) {
            setSeason(season.split("-")[0]);
        } else if (newLeague !== "mlb" && !season.includes("-")) {
            const yr = parseInt(season);
            if (!isNaN(yr)) setSeason(`${yr}-${String(yr + 1).slice(2)}`);
        }
    };

    return (
        <div className="space-y-6">
            {/* Search Form */}
            <form onSubmit={handleSearch} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Player Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder={isMLB ? "e.g., Julio Rodriguez" : "e.g., LeBron James"}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-gray-400 mb-1">League</label>
                        <select
                            value={league}
                            onChange={(e) => handleLeagueChange(e.target.value as League)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500"
                        >
                            <option value="mlb">MLB</option>
                            <option value="nba">NBA</option>
                            <option value="nfl">NFL</option>
                            <option value="ncaam">NCAAM</option>
                        </select>
                    </div>

                    <div className="w-full md:w-32">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Season</label>
                        <input
                            type="text"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            placeholder={seasonPlaceholder}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Searching..." : "Search Stats"}
                    </button>
                </div>
            </form>

            {/* Error Message */}
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {/* MLB Player Header */}
            {mlbPlayer && (
                <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-4 flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-bold text-white">{mlbPlayer.name}</h2>
                        <p className="text-sm text-gray-400">
                            {mlbPlayer.position} &middot; {mlbPlayer.team}
                        </p>
                    </div>
                    {mlbTotals && (
                        <div className="flex gap-4">
                            {mlbPlayer.isPitcher ? (
                                <>
                                    <StatPill label="ERA" value={mlbTotals.era ?? "-"} />
                                    <StatPill label="W-L" value={`${mlbTotals.wins ?? 0}-${mlbTotals.losses ?? 0}`} />
                                    <StatPill label="SO" value={mlbTotals.strikeOuts ?? 0} />
                                    <StatPill label="IP" value={mlbTotals.inningsPitched ?? "-"} />
                                    <StatPill label="WHIP" value={mlbTotals.whip ?? "-"} />
                                </>
                            ) : (
                                <>
                                    <StatPill label="AVG" value={mlbTotals.avg ?? "-"} />
                                    <StatPill label="HR" value={mlbTotals.homeRuns ?? 0} />
                                    <StatPill label="RBI" value={mlbTotals.rbi ?? 0} />
                                    <StatPill label="OPS" value={mlbTotals.ops ?? "-"} />
                                    <StatPill label="SB" value={mlbTotals.stolenBases ?? 0} />
                                </>
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* Results */}
            {data && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-[var(--border)] pb-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setViewMode("gamelog")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "gamelog" ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white"}`}
                            >
                                Game Log
                            </button>
                            <button
                                onClick={() => setViewMode("raw")}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${viewMode === "raw" ? "bg-blue-600/20 text-blue-400" : "text-gray-400 hover:text-white"}`}
                            >
                                Raw JSON
                            </button>
                        </div>

                        {viewMode === "gamelog" && Array.isArray(data) && (
                            <div className="flex items-center gap-2">
                                <label className="text-sm text-gray-400 whitespace-nowrap">Filter Date:</label>
                                <input
                                    type="date"
                                    value={filterDate}
                                    onChange={(e) => setFilterDate(e.target.value)}
                                    className="bg-black/50 border border-gray-700 rounded-lg px-2 py-1 text-white text-sm focus:outline-none focus:border-blue-500"
                                    max={new Date().toISOString().split("T")[0]}
                                />
                                {filterDate && (
                                    <button onClick={() => setFilterDate("")} className="text-gray-400 hover:text-white text-xs whitespace-nowrap">
                                        Clear
                                    </button>
                                )}
                            </div>
                        )}
                    </div>

                    {shotChartUrl && (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden p-6 mb-6">
                            <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-4">
                                <h3 className="text-lg font-medium text-white">Generated Shot Chart</h3>
                                <button onClick={() => setShotChartUrl(null)} className="text-gray-400 hover:text-white text-sm">
                                    Close Chart
                                </button>
                            </div>
                            <div className="flex justify-center bg-white/5 rounded-lg p-4">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={shotChartUrl} alt="Shot Chart" className="max-w-full h-auto rounded-lg shadow-xl" />
                            </div>
                        </div>
                    )}

                    {viewMode === "raw" ? (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <div className="px-6 py-4 border-b border-[var(--border)] bg-black/20 font-medium">
                                Raw Dataset Output: {playerName} ({season})
                            </div>
                            <div className="p-6 overflow-x-auto max-h-[600px] overflow-y-auto">
                                <pre className="text-sm text-gray-300 whitespace-pre-wrap font-mono relative z-10">
                                    {JSON.stringify(data, null, 2)}
                                </pre>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden">
                            <div className="overflow-x-auto">
                                {isMLB ? (
                                    <MLBGameLogTable
                                        data={filterGameLog(data, filterDate, isMLB)}
                                        isPitcher={mlbPlayer?.isPitcher ?? false}
                                    />
                                ) : (
                                    <NBANFLGameLogTable
                                        data={filterGameLog(data, filterDate, false)}
                                        league={league}
                                        playerName={playerName}
                                        season={season}
                                        onShotChart={handleGenerateShotChart}
                                        chartLoadingGameId={chartLoadingGameId}
                                    />
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

// ── Helper Components ─────────────────────────────────────────────────────

function StatPill({ label, value }: { label: string; value: string | number }) {
    return (
        <div className="text-center hidden sm:block">
            <div className="text-xs text-gray-500 uppercase">{label}</div>
            <div className="text-sm font-mono font-bold text-white tabular-nums">{value}</div>
        </div>
    );
}

function filterGameLog(data: GameData[] | null, filterDate: string, isMLB: boolean): GameData[] {
    if (!Array.isArray(data)) return [];
    if (!filterDate) return data;

    if (isMLB) {
        // MLB dates are "2026-04-10" format
        return data.filter((g) => g.GAME_DATE === filterDate);
    }

    // NBA/NFL dates are "JAN 01, 2026" format
    const inputDate = new Date(filterDate);
    const localDate = new Date(inputDate.getTime() + inputDate.getTimezoneOffset() * 60000);
    const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    const formatted = `${monthNames[localDate.getMonth()]} ${localDate.getDate().toString().padStart(2, '0')}, ${localDate.getFullYear()}`;
    return data.filter((g: GameData) =>
        g.GAME_DATE === formatted || (g.GAME_DATE && g.GAME_DATE.toUpperCase().includes(formatted))
    );
}

function MLBGameLogTable({ data, isPitcher }: { data: GameData[]; isPitcher: boolean }) {
    if (data.length === 0) {
        return (
            <div className="px-6 py-8 text-center text-gray-400">
                No games found. Try a different date or season.
            </div>
        );
    }

    if (isPitcher) {
        return (
            <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-400 uppercase bg-black/20">
                    <tr>
                        <th className="px-4 py-4">Date</th>
                        <th className="px-4 py-4">Matchup</th>
                        <th className="px-4 py-4 text-center">IP</th>
                        <th className="px-4 py-4 text-center">H</th>
                        <th className="px-4 py-4 text-center">ER</th>
                        <th className="px-4 py-4 text-center">BB</th>
                        <th className="px-4 py-4 text-center">SO</th>
                        <th className="px-4 py-4 text-center">HR</th>
                        <th className="px-4 py-4 text-center">ERA</th>
                        <th className="px-4 py-4 text-center">PC</th>
                        <th className="px-4 py-4 text-center">Dec</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                    {data.map((game, i) => (
                        <tr key={game.Game_ID || i} className="hover:bg-white/5 transition-colors">
                            <td className="px-4 py-3 whitespace-nowrap text-gray-300">{game.GAME_DATE || '-'}</td>
                            <td className="px-4 py-3 whitespace-nowrap font-medium text-white">{game.MATCHUP || '-'}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.IP}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.H}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.ER}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.BB}</td>
                            <td className="px-4 py-3 text-center tabular-nums font-semibold text-white">{game.SO}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.HR}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.ERA}</td>
                            <td className="px-4 py-3 text-center tabular-nums text-gray-400">{game.PITCHES}</td>
                            <td className="px-4 py-3 text-center text-xs text-gray-400">{game.DECISION}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-black/20">
                <tr>
                    <th className="px-4 py-4">Date</th>
                    <th className="px-4 py-4">Matchup</th>
                    <th className="px-4 py-4 text-center">AB</th>
                    <th className="px-4 py-4 text-center">H</th>
                    <th className="px-4 py-4 text-center">HR</th>
                    <th className="px-4 py-4 text-center">RBI</th>
                    <th className="px-4 py-4 text-center">BB</th>
                    <th className="px-4 py-4 text-center">SO</th>
                    <th className="px-4 py-4 text-center">SB</th>
                    <th className="px-4 py-4 text-center">AVG</th>
                    <th className="px-4 py-4 text-center">OPS</th>
                    <th className="px-4 py-4 text-center">R</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
                {data.map((game, i) => (
                    <tr key={game.Game_ID || i} className="hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 whitespace-nowrap text-gray-300">{game.GAME_DATE || '-'}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium text-white">{game.MATCHUP || '-'}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.AB}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.H}</td>
                        <td className="px-4 py-3 text-center tabular-nums font-semibold text-white">{game.HR}</td>
                        <td className="px-4 py-3 text-center tabular-nums font-semibold text-white">{game.RBI}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.BB}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.SO}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.SB}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.AVG}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.OPS}</td>
                        <td className="px-4 py-3 text-center tabular-nums text-gray-300">{game.R}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}

function NBANFLGameLogTable({
    data, league, playerName, season, onShotChart, chartLoadingGameId,
}: {
    data: GameData[];
    league: string;
    playerName: string;
    season: string;
    onShotChart: (gameId: string) => void;
    chartLoadingGameId: string | null;
}) {
    if (!Array.isArray(data) || data.length === 0) {
        return (
            <div className="px-6 py-8 text-center text-gray-400">
                {Array.isArray(data) ? "No games found matching the selected date." : "Data is not in game log format. Try raw view."}
            </div>
        );
    }

    return (
        <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-400 uppercase bg-black/20">
                <tr>
                    <th className="px-6 py-4">Date</th>
                    <th className="px-6 py-4">Matchup</th>
                    <th className="px-6 py-4 text-center">PTS</th>
                    <th className="px-6 py-4 text-center">REB</th>
                    <th className="px-6 py-4 text-center">AST</th>
                    <th className="px-6 py-4 text-center">MIN</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
                {data.map((game, i) => (
                    <tr key={game.Game_ID || i} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap text-gray-300">{game.GAME_DATE || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium text-white">{game.MATCHUP || '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">{game.PTS ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">{game.REB ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">{game.AST ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-center text-gray-300">{game.MIN ?? '-'}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-right">
                            {league === "nba" && game.Game_ID && (
                                <button
                                    onClick={() => onShotChart(game.Game_ID)}
                                    disabled={chartLoadingGameId === game.Game_ID}
                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-medium rounded-md transition-colors whitespace-nowrap"
                                >
                                    {chartLoadingGameId === game.Game_ID ? "Loading..." : "Shot Chart"}
                                </button>
                            )}
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
