"use client";

interface GameResult {
  status: string;
  homeScore: number | null;
  awayScore: number | null;
  isHome: boolean;
  opponent: string;
  gameDate: string;
}

interface WinLossIndicatorProps {
  games: GameResult[];
  accentColor: string;
}

export function WinLossIndicator({ games, accentColor }: WinLossIndicatorProps) {
  const completed = games
    .filter((g) => g.status === "final" && g.homeScore != null && g.awayScore != null)
    .slice(0, 10);

  if (completed.length === 0) return null;

  const results = completed.map((g) => {
    const teamScore = g.isHome ? g.homeScore! : g.awayScore!;
    const oppScore = g.isHome ? g.awayScore! : g.homeScore!;
    return {
      win: teamScore > oppScore,
      opponent: g.opponent,
      score: g.isHome ? `${g.homeScore}-${g.awayScore}` : `${g.awayScore}-${g.homeScore}`,
      date: new Date(g.gameDate).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    };
  });

  const wins = results.filter((r) => r.win).length;
  const losses = results.length - wins;

  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1">
        {results.map((r, i) => (
          <div
            key={i}
            title={`${r.win ? "W" : "L"} ${r.score} vs ${r.opponent} (${r.date})`}
            className="w-3 h-3 rounded-full transition-transform hover:scale-125 cursor-default"
            style={{ backgroundColor: r.win ? "#22c55e" : "#ef4444" }}
          />
        ))}
      </div>
      <span className="text-xs tabular-nums" style={{ color: accentColor }}>
        Last {results.length}: {wins}-{losses}
      </span>
    </div>
  );
}
