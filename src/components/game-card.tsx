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
  colorSecondary?: string;
}

const teamNames: Record<string, string> = {
  mariners: "Mariners",
  seahawks: "Seahawks",
  supersonics: "SuperSonics",
  cougars: "Cougars",
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
  colorSecondary,
}: GameCardProps) {
  const date = new Date(gameDate);
  const teamName = teamNames[teamSlug] || teamSlug;
  const isFinal = status === "final";
  const isLive = status === "live";

  // Determine W/L for border color
  let borderColor = colorSecondary ?? "#374151";
  if (isFinal && homeScore != null && awayScore != null) {
    const teamScore = isHome ? homeScore : awayScore;
    const oppScore = isHome ? awayScore : homeScore;
    borderColor = teamScore > oppScore ? "#22c55e" : "#ef4444";
  } else if (isLive) {
    borderColor = "#ef4444";
  }

  const now = new Date();
  const showYear = date.getFullYear() !== now.getFullYear();
  const dateStr = showYear
    ? format(date, "EEE, MMM d ''yy")
    : format(date, "EEE, MMM d");

  return (
    <div className="card min-w-[220px]">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs text-gray-500 uppercase tracking-wider">
          {dateStr}
        </span>
        {isLive && (
          <span className="badge bg-red-500/20 text-red-400 animate-pulse">
            LIVE
          </span>
        )}
        {isFinal && (
          <span
            className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded"
            style={{
              color: borderColor,
              background: `${borderColor}15`,
            }}
          >
            {homeScore != null && awayScore != null
              ? (isHome ? homeScore > awayScore : awayScore > homeScore) ? "W" : "L"
              : "Final"}
          </span>
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
          {/* First row is always the away team, second the home team */}
          {isFinal && (
            <span className="text-sm font-semibold tabular-nums">
              {awayScore}
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
            <span className="text-sm font-semibold tabular-nums">
              {homeScore}
            </span>
          )}
        </div>
      </div>

      {venue && (
        <div className="mt-2 text-xs text-gray-600 truncate">{venue}</div>
      )}
    </div>
  );
}
