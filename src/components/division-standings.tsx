"use client";

import { StandingsData } from "@/lib/stats";

interface DivisionStandingsProps {
  standings: StandingsData;
  teamConfig: { colorPrimary: string; colorSecondary: string };
}

export function DivisionStandings({ standings, teamConfig }: DivisionStandingsProps) {
  return (
    <div className="card overflow-x-auto">
      <table className="w-full text-xs">
        <thead>
          <tr className="text-left text-gray-500 border-b border-white/5">
            <th className="pb-2 pr-2 font-medium">Team</th>
            <th className="pb-2 px-1 font-medium text-center">W</th>
            <th className="pb-2 px-1 font-medium text-center">L</th>
            <th className="pb-2 px-1 font-medium text-center">PCT</th>
            <th className="pb-2 px-1 font-medium text-center">GB</th>
            <th className="pb-2 px-1 font-medium text-center">Strk</th>
            <th className="pb-2 px-1 font-medium text-center hidden sm:table-cell">L10</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {standings.teams.map((team) => (
            <tr
              key={team.name}
              className="transition-colors"
              style={team.isCurrentTeam ? {
                background: `${teamConfig.colorPrimary}15`,
                borderLeft: `3px solid ${teamConfig.colorSecondary}`,
              } : undefined}
            >
              <td className={`py-1.5 pr-2 font-medium ${team.isCurrentTeam ? "text-white pl-1.5" : "text-gray-400"}`}>
                {team.shortName}
              </td>
              <td className="py-1.5 px-1 text-center tabular-nums text-gray-300">{team.wins}</td>
              <td className="py-1.5 px-1 text-center tabular-nums text-gray-300">{team.losses}</td>
              <td className="py-1.5 px-1 text-center tabular-nums text-gray-400">{team.pct}</td>
              <td className="py-1.5 px-1 text-center tabular-nums text-gray-400">{team.gamesBack}</td>
              <td className="py-1.5 px-1 text-center tabular-nums">
                <span className={team.streak.startsWith("W") ? "text-green-400" : team.streak.startsWith("L") ? "text-red-400" : "text-gray-500"}>
                  {team.streak}
                </span>
              </td>
              <td className="py-1.5 px-1 text-center tabular-nums text-gray-400 hidden sm:table-cell">{team.last10}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
