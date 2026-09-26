"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { TodaysGameData } from "@/lib/stats";

interface TodaysGameHeroProps {
  game: TodaysGameData;
  teamConfig: {
    name: string;
    slug: string;
    sport: string;
    colorPrimary: string;
    colorSecondary: string;
    colorAccent?: string;
  };
}

function formatGameTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" });
}

function formatGameDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

function Countdown({ gameDate }: { gameDate: string }) {
  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const update = () => {
      const diff = new Date(gameDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Starting soon");
        return;
      }
      const hours = Math.floor(diff / 3600000);
      const mins = Math.floor((diff % 3600000) / 60000);
      if (hours > 0) {
        setTimeLeft(`${hours}h ${mins}m`);
      } else {
        setTimeLeft(`${mins}m`);
      }
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [gameDate]);

  if (!timeLeft) return null;
  return (
    <span className="text-xs text-gray-400 tabular-nums" suppressHydrationWarning>
      {timeLeft}
    </span>
  );
}

export function TodaysGameHero({ game, teamConfig }: TodaysGameHeroProps) {
  if (!game.found) return null;

  const isWin =
    game.status === "final" &&
    game.homeScore != null &&
    game.awayScore != null &&
    (game.isHome ? game.homeScore > game.awayScore : game.awayScore > game.homeScore);

  const isLoss = game.status === "final" && !isWin;

  // Determine which side is "us" vs opponent for display
  const teamName = teamConfig.name.split(" ").pop() ?? teamConfig.name;
  const oppShort = game.opponent.split(" ").pop() ?? game.opponent;

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: `${teamConfig.colorSecondary}30`,
        background: `linear-gradient(135deg, ${teamConfig.colorPrimary}35 0%, ${teamConfig.colorSecondary}15 100%)`,
      }}
    >
      {/* Status bar */}
      <div
        className="flex items-center justify-between px-4 py-1.5 text-xs font-semibold uppercase tracking-wider"
        style={{
          background: game.status === "live"
            ? "rgba(239, 68, 68, 0.2)"
            : game.status === "final"
              ? isWin ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.1)"
              : `${teamConfig.colorSecondary}15`,
          color: game.status === "live"
            ? "#ef4444"
            : game.status === "final"
              ? isWin ? "#22c55e" : "#ef4444"
              : teamConfig.colorSecondary,
        }}
      >
        <span className="flex items-center gap-2">
          {game.status === "live" && (
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          )}
          {game.status === "live" ? "Live" : game.status === "final" ? (isWin ? "Win" : "Loss") : game.isToday ? "Today" : "Next Game"}
        </span>
        <span className="font-normal text-gray-400">
          {game.venue}
        </span>
      </div>

      {/* Matchup */}
      <div className="px-4 py-4 md:px-6">
        <div className="flex items-center justify-between gap-4">
          {/* Home / Away team (left) */}
          <div className="flex-1 flex items-center gap-3">
            <div className="shrink-0 w-12 h-12 md:w-16 md:h-16 relative">
              <Image
                src={`/logo-${teamConfig.slug}.png`}
                alt={teamConfig.name}
                fill
                className="object-contain"
              />
            </div>
            <div className="min-w-0">
              <div className="text-lg md:text-xl font-bold truncate">{teamName}</div>
              {game.teamRecord && (
                <div className="text-xs text-gray-400 tabular-nums">{game.teamRecord}</div>
              )}
            </div>
          </div>

          {/* Center: score or time */}
          <div className="shrink-0 text-center px-3">
            {game.status === "final" || game.status === "live" ? (
              <div className="flex items-center gap-3">
                <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: game.isHome ? (isWin ? "#22c55e" : "#ef4444") : undefined }}>
                  {game.isHome ? game.homeScore : game.awayScore}
                </span>
                <span className="text-sm text-gray-600">-</span>
                <span className="text-2xl md:text-3xl font-bold tabular-nums" style={{ color: !game.isHome ? (isWin ? "#22c55e" : "#ef4444") : undefined }}>
                  {game.isHome ? game.awayScore : game.homeScore}
                </span>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="text-lg md:text-xl font-bold" style={{ color: teamConfig.colorSecondary }}>
                  {formatGameTime(game.gameDate)}
                </div>
                {!game.isToday && (
                  <div className="text-xs text-gray-400">{formatGameDate(game.gameDate)}</div>
                )}
                {game.isToday && <Countdown gameDate={game.gameDate} />}
              </div>
            )}
          </div>

          {/* Opponent (right) */}
          <div className="flex-1 flex items-center justify-end gap-3">
            <div className="min-w-0 text-right">
              <div className="text-lg md:text-xl font-bold truncate">{oppShort}</div>
              {game.opponentRecord && (
                <div className="text-xs text-gray-400 tabular-nums">{game.opponentRecord}</div>
              )}
            </div>
          </div>
        </div>

        {/* Pitcher matchup (MLB) */}
        {(game.probablePitcherHome || game.probablePitcherAway) && game.status === "scheduled" && (
          <div className="mt-3 pt-3 border-t flex items-center justify-center gap-4 text-xs text-gray-400" style={{ borderColor: `${teamConfig.colorSecondary}20` }}>
            <span className="tabular-nums">
              {game.isHome
                ? (game.probablePitcherHome?.name ?? "TBD")
                : (game.probablePitcherAway?.name ?? "TBD")
              }
            </span>
            <span className="text-gray-600 font-semibold">vs</span>
            <span className="tabular-nums">
              {game.isHome
                ? (game.probablePitcherAway?.name ?? "TBD")
                : (game.probablePitcherHome?.name ?? "TBD")
              }
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
