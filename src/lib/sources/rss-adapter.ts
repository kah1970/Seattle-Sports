import Parser from "rss-parser";
import { ArticleItem, SourceAdapter } from "@/lib/types";
import { Sport } from "@/lib/config";

const parser = new Parser({
  timeout: 10000,
  headers: {
    "User-Agent": "SeattleSportsIntel/1.0 (RSS Reader)",
  },
});

interface RSSSourceConfig {
  name: string;
  slug: string;
  url: string;
  teamSlug: string;
  sport: Sport;
  reputation: number;
}

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
    text.includes("analysis") ||
    text.includes("deep dive") ||
    text.includes("advanced") ||
    text.includes("metrics")
  )
    return "analysis";
  if (
    text.includes("opinion") ||
    text.includes("column") ||
    text.includes("take")
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

export function createRSSAdapter(config: RSSSourceConfig): SourceAdapter {
  return {
    name: config.name,
    type: "rss",

    async fetch(): Promise<ArticleItem[]> {
      const feed = await parser.parseURL(config.url);
      const items: ArticleItem[] = [];

      for (const entry of feed.items || []) {
        if (!entry.title || !entry.link) continue;

        const title = entry.title.trim();
        const content = entry.contentSnippet || entry.content || "";

        items.push({
          title,
          url: entry.link,
          publisher: config.name,
          publishedAt: entry.isoDate
            ? new Date(entry.isoDate)
            : new Date(),
          summary: entry.contentSnippet?.slice(0, 500),
          content: content.slice(0, 2000),
          imageUrl: extractImageUrl(entry),
          sport: config.sport,
          teamSlug: config.teamSlug,
          articleType: classifyArticleType(title, content),
          isHighlight: isHighlight(title, content),
          videoUrl: entry.enclosure?.url || undefined,
          tags: extractTags(title, content),
        });
      }

      return items;
    },

    async healthCheck() {
      try {
        const feed = await parser.parseURL(config.url);
        return {
          ok: true,
          message: `OK - ${feed.items?.length || 0} items`,
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

function extractImageUrl(entry: Record<string, unknown>): string | undefined {
  const media = entry["media:content"] as
    | { $?: { url?: string } }
    | undefined;
  if (media?.$?.url) return media.$.url;

  const enclosure = entry.enclosure as
    | { url?: string; type?: string }
    | undefined;
  if (enclosure?.url && enclosure.type?.startsWith("image"))
    return enclosure.url;

  return undefined;
}

function extractTags(title: string, content: string): string[] {
  const tags: string[] = [];
  const text = `${title} ${content}`.toLowerCase();

  const playerPatterns = [
    "julio rodriguez",
    "cal raleigh",
    "logan gilbert",
    "george kirby",
    "geno smith",
    "dk metcalf",
    "tyler lockett",
    "devon witherspoon",
    "kenneth walker",
    "jaxon smith-njigba",
    "kevin durant",
    "gary payton",
    "shawn kemp",
    "ray allen",
    "rashard lewis",
  ];

  for (const player of playerPatterns) {
    if (text.includes(player)) {
      tags.push(player);
    }
  }

  const topicPatterns: [string, string][] = [
    ["trade", "trades"],
    ["injury", "injuries"],
    ["free agent", "free-agency"],
    ["draft", "draft"],
    ["playoff", "playoffs"],
    ["spring training", "spring-training"],
    ["expansion", "expansion"],
    ["relocation", "relocation"],
  ];

  for (const [pattern, tag] of topicPatterns) {
    if (text.includes(pattern)) tags.push(tag);
  }

  return tags;
}
