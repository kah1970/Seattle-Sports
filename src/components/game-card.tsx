import { format } from "date-fns";

interface GameCardProps {
  sport: string;
  teamSlug: string;
  opponent: string;
  gameDate: string;
  isHome: boolean;
  venue?: string | null;
  status: string;
  homeScore?: number | null;
  awayScore?: number | null;
}

const teamNames: Record<string, string> = {
  mariners: "Mariners",
  seahawks: "Seahawks",
  supersonics: "SuperSonics",
};

export function GameCard({
  teamSlug,
  opponent,
  gameDate,
  isHome,
  venue,
  status,
  homeScore,
  awayScore,
}: GameCardProps) {
  const date = new Date(gameDate);
  const teamName = teamNames[teamSlug] || teamSlug;
  const isFinal = status === "final";
  const isLive = status === "live";

  return (
    <div className="card min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {format(date, "EEE, MMM d")}
        </span>
        {isLive && (
          <span className="badge bg-red-500/20 text-red-400 animate-pulse">
            LIVE
          </span>
        )}
        {isFinal && (
          <span className="badge bg-gray-500/20 text-gray-400">FINAL</span>
        )}
        {status === "scheduled" && (
          <span className="text-xs text-gray-500">
            {format(date, "h:mm a")}
          </span>
        )}
      </div>

      <div className="space-y-1.5">
        <div
          className={`flex items-center justify-between ${!isHome ? "font-semibold text-white" : "text-gray-400"}`}
        >
          <span className="text-sm">{isHome ? opponent : teamName}</span>
          {isFinal && (
            <span className="text-sm font-mono">
              {isHome ? awayScore : homeScore}
            </span>
          )}
        </div>
        <div
          className={`flex items-center justify-between ${isHome ? "font-semibold text-white" : "text-gray-400"}`}
        >
          <span className="text-sm">
            {isHome ? teamName : opponent}
            {isHome && " (H)"}
          </span>
          {isFinal && (
            <span className="text-sm font-mono">
              {isHome ? homeScore : awayScore}
            </span>
          )}
        </div>
      </div>

      {venue && (
        <div className="mt-2 text-xs text-gray-600">{venue}</div>
      )}
    </div>
  );
}
