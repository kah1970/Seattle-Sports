import Link from "next/link";
import Image from "next/image";
import type { TeamStatus } from "@/lib/team-status";

const toneDot: Record<NonNullable<TeamStatus["tone"]>, string> = {
  good: "bg-emerald-400",
  bubble: "bg-amber-400",
  bad: "bg-rose-400",
};

export function TeamStatusStrip({ teams }: { teams: TeamStatus[] }) {
  return (
    // Phones: a swipeable row. Wider screens: a grid.
    <div
      className="-mx-4 flex snap-x snap-mandatory scroll-px-4 gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0 sm:pb-0 xl:grid-cols-4"
      data-testid="team-status-strip"
    >
      {teams.map((t) => {
        const isRecord = /^\d+-\d+/.test(t.headline);
        return (
          <Link
            key={t.slug}
            href={`/team/${t.slug}`}
            className="group relative w-[78%] shrink-0 snap-start overflow-hidden rounded-xl sm:w-auto border border-[var(--border)] bg-[var(--card)] p-4 transition-colors hover:bg-[var(--card-hover)]"
          >
            {/* team-color accent */}
            <span
              className="absolute inset-x-0 top-0 h-1"
              style={{ background: t.colorSecondary }}
              aria-hidden="true"
            />
            <div className="flex items-center gap-3">
              <div className="relative h-10 w-10 shrink-0">
                <Image src={t.logo} alt="" fill className="object-contain" />
              </div>
              <div className="min-w-0">
                <div className="truncate text-sm font-semibold text-gray-200 group-hover:text-white">
                  {t.name}
                </div>
                {t.badge && (
                  <div className="truncate text-xs font-semibold text-yellow-300">{t.badge}</div>
                )}
              </div>
            </div>

            <div className="mt-3 flex items-baseline gap-2">
              <span
                className={
                  isRecord
                    ? "text-2xl font-bold tabular-nums text-white"
                    : "text-base font-semibold text-gray-100"
                }
              >
                {t.headline}
              </span>
              {t.label && (
                <span className="text-xs uppercase tracking-wide text-gray-500">{t.label}</span>
              )}
            </div>

            {t.status && (
              <div className="mt-1 flex items-center gap-1.5 text-xs text-gray-400">
                {t.tone && (
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[t.tone]}`} aria-hidden="true" />
                )}
                <span className="truncate">{t.status}</span>
              </div>
            )}

            <div className="mt-3 border-t border-white/5 pt-2 text-xs">
              {t.next ? (
                <span className={t.next.live ? "font-semibold text-red-400" : "text-gray-300"}>
                  {t.next.live && (
                    <span className="mr-1 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 align-middle motion-reduce:animate-none" />
                  )}
                  {t.next.text}
                </span>
              ) : (
                <span className="text-gray-600">No game scheduled</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
