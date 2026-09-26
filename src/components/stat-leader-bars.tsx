"use client";

import { PlayerStat } from "@/lib/stats";

interface StatLeaderBarsProps {
  players: PlayerStat[];
  stat: string;
  accentColor: string;
}

export function StatLeaderBars({ players, stat, accentColor }: StatLeaderBarsProps) {
  // Get numeric values for the stat
  const entries = players
    .map((p) => ({
      name: p.name,
      value: typeof p.stats[stat] === "number" ? p.stats[stat] as number : parseFloat(String(p.stats[stat])),
      display: String(p.stats[stat]),
    }))
    .filter((e) => !isNaN(e.value) && e.value > 0)
    .slice(0, 5);

  if (entries.length === 0) return null;

  const max = Math.max(...entries.map((e) => e.value));

  return (
    <div className="space-y-1.5">
      {entries.map((entry) => {
        const pct = max > 0 ? (entry.value / max) * 100 : 0;
        return (
          <div key={entry.name} className="flex items-center gap-2">
            <span className="text-xs text-gray-400 w-24 truncate shrink-0" title={entry.name}>
              {entry.name.split(" ").pop()}
            </span>
            <div className="flex-1 h-5 bg-white/5 rounded overflow-hidden relative">
              <div
                className="h-full rounded-r transition-all duration-700"
                style={{
                  width: `${Math.max(pct, 8)}%`,
                  background: `linear-gradient(90deg, ${accentColor}60, ${accentColor}90)`,
                }}
              />
            </div>
            <span className="text-xs font-mono text-gray-300 w-10 text-right tabular-nums shrink-0">
              {entry.display}
            </span>
          </div>
        );
      })}
    </div>
  );
}
