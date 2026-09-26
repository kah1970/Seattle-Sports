import Parser from "rss-parser";
import { ArticleItem, SourceAdapter } from "@/lib/types";
import { RSSSourceConfig, TEAM_KEYWORDS } from "@/lib/config";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "SeattleSportsIntel/1.0 (RSS Reader)",
  },
  customFields: {
    item: [
      ["media:content", "mediaContent"],
      ["media:thumbnail", "mediaThumbnail"],
      ["itunes:image", "itunesImage"],
      ["content:encoded", "contentEncoded"],
    ],
  },
});

// ── Article Classification ─────────────────────────────────────────────────

function classifyArticleType(
  title: string,
  content?: string
): ArticleItem["articleType"] {
  const text = `${title} ${content || ""}`.toLowerCase();

  if (
    text.includes("highlight") ||
    text.includes("watch") ||
    text.includes("video")
  )
    return "highlights";

  if (
    text.includes("this day in") ||
    text.includes("anniversary") ||
    text.includes("throwback") ||
    text.includes("years ago") ||
    text.includes("in history") ||
    text.includes("on this date")
  )
    return "retrospective";

  if (
    text.includes("spring training") ||
    text.includes("cactus league") ||
    text.includes("spring camp") ||
    text.includes("roster invite") ||
    text.includes(" nri ") ||
    text.includes("non-roster")
  )
    return "spring-training";

  if (
    text.includes(" dfa ") ||
    text.includes("designated for assignment") ||
    text.includes("waiver") ||
    text.includes("released from") ||
    text.includes("claimed off") ||
    text.includes("free agent signing") ||
    text.includes("agrees to deal") ||
    text.includes("signs with")
  )
    return "roster-move";

  if (
    text.includes("prospect") ||
    text.includes("minor league") ||
    text.includes("farm system") ||
    text.includes("top-30") ||
    text.includes("top 30") ||
    text.includes("pipeline")
  )
    return "prospects";

  if (
    text.includes("analysis") ||
    text.includes("deep dive") ||
    text.includes("advanced") ||
    text.includes("metrics") ||
    text.includes("breakdown") ||
    text.includes("statcast")
  )
    return "analysis";

  if (
    text.includes("opinion") ||
    text.includes("column") ||
    text.includes(" take ") ||
    text.includes("mailbag")
  )
    return "opinion";

  return "news";
}

function isHighlight(title: string, content?: string): boolean {
  const text = `${title} ${content || ""}`.toLowerCase();
  return (
    text.includes("highlight") ||
    text.includes("video") ||
    text.includes("watch") ||
    text.includes("top play")
  );
}

// ── Image Extraction ───────────────────────────────────────────────────────

function extractImageUrl(entry: Record<string, unknown>): string | undefined {
  // 1. media:content
  const media = entry["mediaContent"] as { $?: { url?: string } } | undefined;
  if (media?.$?.url) return media.$.url;

  // 2. media:thumbnail
  const thumb = entry["mediaThumbnail"] as { $?: { url?: string } } | undefined;
  if (thumb?.$?.url) return thumb.$.url;

  // 3. itunes:image
  const itunes = entry["itunesImage"] as { $?: { href?: string } } | string | undefined;
  if (typeof itunes === "object" && itunes?.$?.href) return itunes.$.href;
  if (typeof itunes === "string" && itunes.startsWith("http")) return itunes;

  // 4. enclosure (image type)
  const enclosure = entry["enclosure"] as { url?: string; type?: string } | undefined;
  if (enclosure?.url && enclosure.type?.startsWith("image")) return enclosure.url;

  // 5. First <img src="..."> found in content:encoded HTML
  const encoded = entry["contentEncoded"] as string | undefined;
  if (encoded) {
    const match = encoded.match(/<img[^>]+src=["']([^"']+)["']/i);
    if (match?.[1]) return match[1];
  }

  return undefined;
}

// ── Summary Extraction ─────────────────────────────────────────────────────

function extractSummary(entry: Record<string, unknown>): string | undefined {
  // Try to get the first <p> from content:encoded
  const encoded = entry["contentEncoded"] as string | undefined;
  if (encoded) {
    const match = encoded.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    if (match?.[1]) {
      const text = match[1].replace(/<[^>]+>/g, "").trim();
      if (text.length > 20) return text.slice(0, 500);
    }
  }
  // Fall back to contentSnippet
  const snippet = entry["contentSnippet"] as string | undefined;
  return snippet?.slice(0, 500);
}

// ── Tag Extraction ─────────────────────────────────────────────────────────

const PLAYER_PATTERNS = [
  // Mariners 2026
  "julio rodriguez",
  "julio rodríguez",
  "cal raleigh",
  "logan gilbert",
  "george kirby",
  "luis castillo",
  "mitch haniger",
  "jorge polanco",
  "j.p. crawford",
  "jp crawford",
  "colt emerson",
  "lazaro montes",
  "cole young",
  "bryce miller",
  "bryan woo",
  "matt brash",
  "andrés muñoz",
  "andres munoz",
  // Seahawks 2026 — Super Bowl LX champions
  "sam darnold",
  "jaxon smith-njigba",
  "jsn",
  "devon witherspoon",
  "cooper kupp",
  "rashid shaheed",
  "ernest jones",
  "leonard williams",
  "drew lock",
  "jalen milroe",
  "abe lucas",
  "jake bobo",
  "tory horton",
  "michael penix",
];

const TOPIC_PATTERNS: [string, string][] = [
  ["trade", "trades"],
  ["injury", "injuries"],
  ["free agent", "free-agency"],
  ["draft", "draft"],
  ["playoff", "playoffs"],
  ["spring training", "spring-training"],
  ["cactus league", "spring-training"],
  ["prospect", "prospects"],
  ["lineup", "lineup"],
  ["rotation", "rotation"],
  ["bullpen", "bullpen"],
  ["roster", "roster"],
  [" dfa ", "roster-move"],
  ["designated for assignment", "roster-move"],
  ["waiver", "waiver"],
  ["injured list", "il"],
  [" il ", "il"],
  ["walk-off", "walk-off"],
  ["walkoff", "walk-off"],
  ["shutout", "shutout"],
  ["no-hitter", "no-hitter"],
  ["no hitter", "no-hitter"],
  ["expansion", "expansion"],
  ["relocation", "relocation"],
  ["milestone", "milestone"],
  ["record", "record"],
];

function extractTags(title: string, content: string): string[] {
  const tags: string[] = [];
  const text = `${title} ${content}`.toLowerCase();

  for (const player of PLAYER_PATTERNS) {
    if (text.includes(player)) {
      tags.push(player.replace(/\./g, "").replace(/\s+/g, "-"));
    }
  }

  for (const [pattern, tag] of TOPIC_PATTERNS) {
    if (text.includes(pattern)) tags.push(tag);
  }

  return Array.from(new Set(tags)); // deduplicate
}

// ── Team Routing ───────────────────────────────────────────────────────────

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** True if the text mentions one of the team's keywords as a whole word. */
export function mentionsTeam(text: string, slug: string): boolean {
  const keywords = TEAM_KEYWORDS[slug] || [slug];
  const lower = text.toLowerCase();
  return keywords.some((kw) =>
    new RegExp(`(^|[^\\p{L}\\p{N}])${escapeRegExp(kw)}($|[^\\p{L}\\p{N}])`, "u").test(lower)
  );
}

/**
 * Decide which of a feed's teams an article belongs to.
 * - Team-specific feeds (no requireTeamMatch) keep every article.
 * - Feeds with requireTeamMatch keep an article only for teams it mentions;
 *   an article that mentions none of them is dropped (empty array).
 * - Cross-team feeds without requireTeamMatch fall back to the primary team.
 */
export function routeArticle(
  title: string,
  content: string,
  config: Pick<RSSSourceConfig, "teamSlug" | "teamSlugs" | "requireTeamMatch">
): string[] {
  const candidates = config.teamSlugs ?? [config.teamSlug];
  if (!config.requireTeamMatch && !config.teamSlugs) return [config.teamSlug];

  const text = `${title} ${content}`;
  const matched = candidates.filter((slug) => mentionsTeam(text, slug));
  if (matched.length > 0) return matched;
  return config.requireTeamMatch ? [] : [config.teamSlug];
}

// ── HTML Entity Decoder ────────────────────────────────────────────────────

/** Decode common HTML entities that RSS feeds emit in title/summary fields */
function decodeEntities(text: string): string {
  return text
    .replace(/&#8211;/g, "\u2013")   // en-dash
    .replace(/&#8212;/g, "\u2014")   // em-dash
    .replace(/&#8216;/g, "\u2018")   // left single quote
    .replace(/&#8217;/g, "\u2019")   // right single quote / apostrophe
    .replace(/&#8220;/g, "\u201C")   // left double quote
    .replace(/&#8221;/g, "\u201D")   // right double quote
    .replace(/&#8230;/g, "\u2026")   // ellipsis
    .replace(/&#038;/g, "&")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#[0-9]+;/g, (m) => String.fromCharCode(parseInt(m.slice(2, -1), 10)));
}

// ── Adapter Factory ────────────────────────────────────────────────────────

export function createRSSAdapter(config: RSSSourceConfig): SourceAdapter {
  return {
    name: config.name,
    type: "rss",
    minFetchIntervalMinutes: config.minFetchIntervalMinutes ?? 30,
    maxItems: config.maxItems ?? 20,

    async fetch(): Promise<ArticleItem[]> {
      const feed = await parser.parseURL(config.url);
      const items: ArticleItem[] = [];
      const rawItems = (feed.items || []).slice(0, config.maxItems ?? 20);

      for (const entry of rawItems) {
        if (!entry.title || !entry.link) continue;

        const title = decodeEntities(entry.title.trim());
        const entryRaw = entry as unknown as Record<string, unknown>;
        const contentEncoded = entryRaw["contentEncoded"] as string | undefined;
        const rawContent = (entryRaw["content"] as string | undefined);
        const content = (
          contentEncoded ||
          rawContent ||
          entry.contentSnippet ||
          ""
        ).slice(0, 5000);

        const summary = extractSummary(entryRaw) ?? entry.contentSnippet?.slice(0, 500);
        const articleType = classifyArticleType(title, content);
        const tags = extractTags(title, content);

        // Assign to the team(s) the article is about; drop off-topic items
        // from league-wide and cross-team feeds.
        const targetSlugs = routeArticle(title, content, config);
        if (targetSlugs.length === 0) continue;

        for (const teamSlug of targetSlugs) {
          items.push({
            title,
            url: targetSlugs.length > 1
              ? `${entry.link}#team-${teamSlug}`   // make URL unique per-team copy
              : entry.link,
            publisher: config.name,
            publishedAt: entry.isoDate ? new Date(entry.isoDate) : new Date(),
            summary,
            content: content.slice(0, 5000),
            imageUrl: extractImageUrl(entryRaw),
            sport: config.sport,
            teamSlug,
            articleType,
            isHighlight: isHighlight(title, content),
            videoUrl: entry.enclosure?.url || undefined,
            tags,
          });
        }
      }

      return items;
    },

    async healthCheck() {
      try {
        const feed = await parser.parseURL(config.url);
        return {
          ok: true,
          message: `OK – ${feed.items?.length ?? 0} items`,
        };
      } catch (err) {
        return {
          ok: false,
          message: err instanceof Error ? err.message : "Unknown error",
        };
      }
    },
  };
}
