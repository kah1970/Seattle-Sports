import { SourceAdapter } from "@/lib/types";
import { RSS_SOURCES } from "@/lib/config";
import { createRSSAdapter } from "./rss-adapter";
import { createMLBScoresAdapter } from "./mlb-scores-adapter";
import { createNFLScoresAdapter } from "./nfl-scores-adapter";

export interface AdapterRegistry {
  news: SourceAdapter[];
  scores: SourceAdapter[];
}

export function createAdapterRegistry(): AdapterRegistry {
  const news: SourceAdapter[] = RSS_SOURCES.map((src) => createRSSAdapter(src));
  const scores: SourceAdapter[] = [
    createMLBScoresAdapter(),
    createNFLScoresAdapter(),
  ];

  return { news, scores };
}

export { createRSSAdapter } from "./rss-adapter";
export { createMLBScoresAdapter } from "./mlb-scores-adapter";
export { createNFLScoresAdapter } from "./nfl-scores-adapter";
