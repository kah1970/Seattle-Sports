/**
 * StatsWidget — displays live roster and stat leaders for a Seattle team.
 *
 * Server component: data is fetched at render time using the stats module.
 * Results are cached at the fetch layer (Next.js `next: { revalidate }`).
 */
import { fetchTeamStats, StatsResponse } from "@/lib/stats";

interface StatsWidgetProps {
    teamSlug: string;
}

export async function StatsWidget({ teamSlug }: StatsWidgetProps) {
    let stats: StatsResponse;
    try {
        stats = await fetchTeamStats(teamSlug);
    } catch {
        return null; // don't break the page if stats fail
    }

    const hasRoster = stats.roster && stats.roster.length > 0;
    const hasLeaders = stats.leaders && stats.leaders.length > 0;

    if (!hasRoster && !hasLeaders && !stats.error) return null;

    return (
        <div className="space-y-6">
            {/* Stat Leaders */}
            {hasLeaders && stats.leaders!.map((group) => (
                <div key={group.category} className="card">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        {group.category}
                        <span className="ml-2 text-gray-600 normal-case font-normal">
                            ({stats.season} season)
                        </span>
                    </h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-left text-gray-500 text-xs border-b border-white/5">
                                    <th className="pb-2 pr-4 font-medium">Player</th>
                                    {Object.keys(group.players[0]?.stats ?? {}).map((key) => (
                                        <th key={key} className="pb-2 px-2 font-medium text-center">{key}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {group.players.map((player, i) => (
                                    <tr
                                        key={player.name}
                                        className={`transition-colors ${i === 0 ? "text-white" : "text-gray-400"} hover:text-white`}
                                    >
                                        <td className="py-2 pr-4">
                                            <span className="font-medium">{player.name}</span>
                                            {player.position && (
                                                <span className="ml-1.5 text-xs text-gray-500">{player.position}</span>
                                            )}
                                        </td>
                                        {Object.values(player.stats).map((val, j) => (
                                            <td key={j} className="py-2 px-2 text-center tabular-nums">
                                                {String(val)}
                                            </td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            ))}

            {/* Roster */}
            {hasRoster && (
                <div className="card">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                        Active Roster
                        <span className="ml-2 text-gray-600 normal-case font-normal">
                            ({stats.roster!.length} players)
                        </span>
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
                        {stats.roster!.map((player) => (
                            <div
                                key={player.name}
                                className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors"
                            >
                                {player.jerseyNumber && (
                                    <span className="text-xs text-gray-500 w-5 text-right tabular-nums shrink-0">
                                        #{player.jerseyNumber}
                                    </span>
                                )}
                                <div className="min-w-0">
                                    <div className="text-sm text-gray-300 truncate">{player.name}</div>
                                    <div className="text-xs text-gray-500">{player.position}</div>
                                </div>
                                {player.status && (
                                    <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded ml-auto shrink-0">
                                        {player.status}
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Attribution */}
            <p className="text-xs text-gray-600 text-right">
                Stats via {stats.sport === "MLB" ? "MLB Stats API" : "ESPN API"} · Updated {new Date(stats.fetchedAt).toLocaleTimeString()}
            </p>
        </div>
    );
}
