import type { TodaysGameData } from "@/lib/stats";

/** One team's card in the home page scoreboard strip. */
export interface TeamStatus {
  slug: string;
  name: string;
  logo: string;
  colorSecondary: string;
  /** Big text: a W-L record, or a short status when there's no season. */
  headline: string;
  /** Small label beside the headline, e.g. the season year. */
  label: string;
  /** One line under the headline, e.g. "3rd AL West · Season slipping away". */
  status: string | null;
  tone: "good" | "bubble" | "bad" | null;
  badge: string | null;
  next: { text: string; live: boolean } | null;
}

const PACIFIC = "America/Los_Angeles";
const TWO_WORD_NICKNAMES = ["Red Sox", "White Sox", "Blue Jays"];

/** "Los Angeles Angels" → "Angels", "Boston Red Sox" → "Red Sox". */
export function nickname(fullName: string): string {
  const words = fullName.trim().split(/\s+/);
  const lastTwo = words.slice(-2).join(" ");
  if (TWO_WORD_NICKNAMES.includes(lastTwo)) return lastTwo;
  return words[words.length - 1] || fullName;
}

function pacificDay(d: Date): string {
  return d.toLocaleDateString("en-US", { timeZone: PACIFIC });
}

/**
 * Describes a team's next (or current) game for the scoreboard strip,
 * in Seattle time: "Tonight 6:40 PM vs Angels", "LIVE · 3-2 @ Rams",
 * "Final · W 5-2 vs Angels".
 */
export function describeGame(
  game: TodaysGameData | null,
  now: Date = new Date()
): { text: string; live: boolean } | null {
  if (!game?.found) return null;
  const opponent = nickname(game.opponent);
  const vs = `${game.isHome ? "vs" : "@"} ${opponent}`;
  const date = new Date(game.gameDate);

  if (game.status !== "scheduled" && game.homeScore != null && game.awayScore != null) {
    const ours = game.isHome ? game.homeScore : game.awayScore;
    const theirs = game.isHome ? game.awayScore : game.homeScore;
    if (game.status === "live") {
      return { text: `LIVE · ${ours}-${theirs} ${vs}`, live: true };
    }
    const result = ours > theirs ? "W" : ours < theirs ? "L" : "T";
    return { text: `Final · ${result} ${ours}-${theirs} ${vs}`, live: false };
  }

  const time = date.toLocaleTimeString("en-US", {
    timeZone: PACIFIC,
    hour: "numeric",
    minute: "2-digit",
  });
  const tomorrow = new Date(now.getTime() + 86400000);
  let day: string;
  if (pacificDay(date) === pacificDay(now)) {
    const hour = Number(
      date.toLocaleString("en-US", { timeZone: PACIFIC, hour: "numeric", hour12: false })
    );
    day = hour >= 17 ? "Tonight" : "Today";
  } else if (pacificDay(date) === pacificDay(tomorrow)) {
    day = "Tomorrow";
  } else {
    day = date.toLocaleDateString("en-US", { timeZone: PACIFIC, weekday: "short" });
  }
  return { text: `${day} ${time} ${vs}`, live: false };
}
