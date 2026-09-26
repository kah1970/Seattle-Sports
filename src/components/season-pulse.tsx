import {
  MLB_SEASON_GAMES,
  SeasonPulse as SeasonPulseData,
  ordinal,
  PulseTone,
} from "@/lib/analytics/season-pulse";

const toneBadge: Record<PulseTone, string> = {
  good: "bg-emerald-500/20 text-emerald-400",
  bubble: "bg-amber-500/20 text-amber-400",
  bad: "bg-rose-500/20 text-rose-400",
};

/** Top third of MLB is green, bottom third red. */
function rankStyle(rank: number, of: number): { text: string; bar: string } {
  const third = of / 3;
  if (rank <= third) return { text: "text-emerald-400", bar: "bg-emerald-500" };
  if (rank <= third * 2) return { text: "text-gray-300", bar: "bg-gray-400" };
  return { text: "text-rose-400", bar: "bg-rose-500" };
}

function formatDiff(n: number): string {
  return n > 0 ? `+${n}` : String(n);
}

export function SeasonPulse({ pulse }: { pulse: SeasonPulseData | null }) {
  if (!pulse) {
    return (
      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Season Pulse
        </h2>
        <p className="text-sm text-gray-500">
          Live standings are unavailable right now. The research links have the
          latest numbers.
        </p>
      </div>
    );
  }

  // Division place and last 10 are already in the standings table,
  // so these tiles cover what it doesn't: the wild-card race and whether
  // the record matches how well the team has actually played.
  const stats: { label: string; value: string; hint?: string }[] = [
    {
      label: "Wild card",
      value: pulse.wildCardGamesBack ?? "—",
      hint: "games back",
    },
    {
      label: "Win pace",
      value: String(pulse.winPace),
      hint: `over ${MLB_SEASON_GAMES} games`,
    },
    {
      label: "Run diff",
      value:
        pulse.runDifferential !== null
          ? formatDiff(pulse.runDifferential)
          : "—",
      hint:
        pulse.runsScored !== null && pulse.runsAllowed !== null
          ? `${pulse.runsScored} scored, ${pulse.runsAllowed} allowed`
          : undefined,
    },
    {
      label: "Expected record",
      value:
        pulse.pythagWins !== null
          ? `${pulse.pythagWins}-${pulse.pythagLosses}`
          : "—",
      hint: "from run differential",
    },
  ];

  return (
    <div className="card hover:bg-[var(--card)]" data-testid="season-pulse">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
            {pulse.season} Season Pulse
          </h2>
          <div className="mt-2 flex items-baseline gap-3">
            <span className="text-3xl font-bold font-mono">
              {pulse.wins}-{pulse.losses}
            </span>
            <span className={`badge ${toneBadge[pulse.verdict.tone]}`}>
              {pulse.verdict.headline}
            </span>
          </div>
          <p className="mt-1.5 text-sm text-gray-400 max-w-xl">
            {pulse.verdict.detail}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-md bg-white/5 px-3 py-2">
            <div className="text-xs text-gray-500 uppercase tracking-wide truncate">
              {s.label}
            </div>
            <div className="text-lg font-mono text-gray-100">{s.value}</div>
            {s.hint && <div className="text-xs text-gray-500">{s.hint}</div>}
          </div>
        ))}
      </div>

      {pulse.ranks.length > 0 && (
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
            Where they rank in MLB
          </h3>
          <div className="space-y-1.5">
            {pulse.ranks.map((r) => {
              const style = rankStyle(r.rank, r.of);
              return (
                <div key={r.label} className="flex items-center gap-3 text-sm">
                  <span className="w-24 text-gray-400 shrink-0">{r.label}</span>
                  <div className="flex-1 h-1.5 rounded bg-gray-800 overflow-hidden">
                    <div
                      className={`h-full ${style.bar} opacity-70`}
                      style={{
                        width: `${((r.of - r.rank + 1) / r.of) * 100}%`,
                      }}
                    />
                  </div>
                  <span className="w-14 text-right font-mono text-gray-300">
                    {r.value}
                  </span>
                  <span className={`w-16 text-right font-mono ${style.text}`}>
                    {ordinal(r.rank)}/{r.of}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
