"use client";

import { useState } from "react";

export function DateSearchClient() {
    const [playerName, setPlayerName] = useState("");
    const [season, setSeason] = useState("2025-26");
    const [searchDate, setSearchDate] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<any>(null); // The matched game
    const [shotChartUrl, setShotChartUrl] = useState<string | null>(null);
    const [chartLoading, setChartLoading] = useState(false);

    const handleGenerateShotChart = async (gameId: string) => {
        setChartLoading(true);
        setShotChartUrl(null);
        setError(null);

        try {
            const res = await fetch("/api/stats/player", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    league: "nba",
                    endpoint: "hexmap",
                    payload: {
                        playerName,
                        season,
                        seasonType: "Regular Season",
                        gameId
                    },
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || `Error ${res.status}`);
            }

            setShotChartUrl(json.imageUrl);
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load shot chart");
        } finally {
            setChartLoading(false);
        }
    };

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!playerName || !season || !searchDate) return;

        setLoading(true);
        setError(null);
        setData(null);
        setShotChartUrl(null);

        // Format user date from YYYY-MM-DD input to what NBA API uses (e.g. SEP 10, 2024? Actually NBA game logs usually have "MMM DD, YYYY")
        // The API returns GAME_DATE typically as "OCT 24, 2023". Let's parse the user's HTML date
        const inputDate = new Date(searchDate);
        // Correct timezone issue where typical local parsing shifts back a day
        const localDate = new Date(inputDate.getTime() + inputDate.getTimezoneOffset() * 60000);

        const monthNames = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
        const formattedDate = `${monthNames[localDate.getMonth()]} ${localDate.getDate().toString().padStart(2, '0')}, ${localDate.getFullYear()}`;

        try {
            const res = await fetch("/api/stats/player", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    league: "nba",
                    endpoint: "perSeasonStats",
                    payload: {
                        playerName,
                        season,
                        seasonType: "Regular Season",
                    },
                }),
            });

            const json = await res.json();

            if (!res.ok) {
                throw new Error(json.error || `Error ${res.status}`);
            }

            const games = Array.isArray(json.data) ? json.data : json;
            if (!Array.isArray(games)) {
                throw new Error("Invalid response format from server");
            }

            // Find the game matching the formatted date
            const matchedGame = games.find((g: any) => g.GAME_DATE === formattedDate);

            if (!matchedGame) {
                // If the exact formatted date failed, case-insensitive check and substring check as fallback
                const fallbackMatch = games.find((g: any) =>
                    g.GAME_DATE && g.GAME_DATE.toUpperCase().includes(formattedDate)
                );

                if (fallbackMatch) {
                    setData(fallbackMatch);
                } else {
                    throw new Error(`No games found for ${playerName} on ${formattedDate}. Check the Game Log to see exact dates.`);
                }
            } else {
                setData(matchedGame);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unknown error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <form onSubmit={handleSearch} className="bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label className="block text-sm font-medium text-gray-400 mb-1">NBA Player Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="e.g., LeBron James"
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="w-full md:w-40">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Season</label>
                        <input
                            type="text"
                            value={season}
                            onChange={(e) => setSeason(e.target.value)}
                            placeholder="2025-26"
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                        />
                    </div>

                    <div className="w-full md:w-48">
                        <label className="block text-sm font-medium text-gray-400 mb-1">Game Date</label>
                        <input
                            type="date"
                            value={searchDate}
                            onChange={(e) => setSearchDate(e.target.value)}
                            className="w-full bg-black/50 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
                            required
                            max={new Date().toISOString().split("T")[0]}
                        />
                    </div>
                </div>

                <div className="mt-6 flex justify-end">
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Searching..." : "Find Game Stats"}
                    </button>
                </div>
            </form>

            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-lg text-sm font-medium">
                    {error}
                </div>
            )}

            {data && (
                <div className="space-y-6">
                    <div className="bg-gradient-to-br from-indigo-900/50 to-blue-900/50 border border-indigo-500/30 rounded-xl overflow-hidden p-6 relative">
                        <div className="absolute top-0 right-0 p-6 opacity-10 pointer-events-none">
                            <span className="text-8xl font-black">{data.PTS}</span>
                        </div>

                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 border-b border-indigo-500/20 pb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-white mb-1">{data.MATCHUP}</h2>
                                <p className="text-indigo-300 font-medium">{data.GAME_DATE}</p>
                            </div>

                            <div className="mt-4 md:mt-0 flex flex-wrap gap-3">
                                <div className="bg-black/40 px-4 py-2 rounded-lg border border-black/50 text-center">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Points</div>
                                    <div className="text-xl font-bold text-white">{data.PTS}</div>
                                </div>
                                <div className="bg-black/40 px-4 py-2 rounded-lg border border-black/50 text-center">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Rebounds</div>
                                    <div className="text-xl font-bold text-white">{data.REB}</div>
                                </div>
                                <div className="bg-black/40 px-4 py-2 rounded-lg border border-black/50 text-center">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Assists</div>
                                    <div className="text-xl font-bold text-white">{data.AST}</div>
                                </div>
                                <div className="bg-black/40 px-4 py-2 rounded-lg border border-black/50 text-center">
                                    <div className="text-xs text-gray-400 uppercase tracking-wider mb-1">Minutes</div>
                                    <div className="text-xl font-bold text-white">{data.MIN}</div>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between items-center bg-black/20 rounded-lg p-4">
                            <div className="text-sm text-gray-300">
                                <span className="mr-4"><strong>FGM/A:</strong> {data.FGM}/{data.FGA} ({data.FG_PCT && (data.FG_PCT * 100).toFixed(1)}%)</span>
                                <span className="mr-4"><strong>3PM/A:</strong> {data.FG3M}/{data.FG3A} ({data.FG3_PCT && (data.FG3_PCT * 100).toFixed(1)}%)</span>
                                <span><strong>+/-:</strong> <span className={data.PLUS_MINUS > 0 ? 'text-green-400' : 'text-red-400'}>{data.PLUS_MINUS > 0 ? '+' : ''}{data.PLUS_MINUS}</span></span>
                            </div>

                            {data.Game_ID && (
                                <button
                                    onClick={() => handleGenerateShotChart(data.Game_ID)}
                                    disabled={chartLoading || shotChartUrl !== null}
                                    className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-sm font-medium rounded-lg transition-colors shadow-lg"
                                >
                                    {chartLoading ? "Generating..." : shotChartUrl ? "Chart Generated" : "Generate Shot Chart"}
                                </button>
                            )}
                        </div>
                    </div>

                    {shotChartUrl && (
                        <div className="bg-[var(--card)] border border-[var(--border)] rounded-xl overflow-hidden p-6">
                            <div className="flex justify-between items-center mb-4 border-b border-[var(--border)] pb-4">
                                <h3 className="text-lg font-medium text-white">Interactive Shot Chart</h3>
                                <button onClick={() => setShotChartUrl(null)} className="text-gray-400 hover:text-white text-sm">
                                    Hide Chart
                                </button>
                            </div>
                            <div className="flex justify-center bg-zinc-900/50 rounded-xl p-6 border border-zinc-800">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={shotChartUrl} alt={`Shot chart for ${playerName} on ${data.GAME_DATE}`} className="max-w-full h-auto rounded-lg shadow-2xl" />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
