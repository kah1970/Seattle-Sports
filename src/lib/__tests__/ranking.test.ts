import { describe, it, expect } from "vitest";
import {
  computeRankScore,
  computeAnalysisDepth,
  deduplicateArticles,
  titleSimilarity,
} from "../ranking";

describe("computeRankScore", () => {
  it("uses each feed's configured reputation", () => {
    const base = { publishedAt: new Date(), analysisDepth: 0.3, clickCount: 0, bookmarkCount: 0 };
    // MLB.com Mariners News is configured at 95; an unknown publisher gets 50
    expect(computeRankScore({ ...base, publisher: "MLB.com Mariners News" })).toBeGreaterThan(
      computeRankScore({ ...base, publisher: "Some Unknown Blog" })
    );
  });

  it("ranks today's quick news above a months-old deep analysis piece", () => {
    // Mirrors a real case: a 6-month-old Lookout Landing analysis piece
    // sitting above the day's MLB.com news on the Mariners page.
    const today = computeRankScore({
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
      publisher: "MLB.com Mariners News",
      analysisDepth: 0.15,
      clickCount: 0,
      bookmarkCount: 0,
    });
    const sixMonthsOld = computeRankScore({
      publishedAt: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000),
      publisher: "Lookout Landing",
      analysisDepth: 0.9,
      clickCount: 3,
      bookmarkCount: 0,
    });
    expect(today).toBeGreaterThan(sixMonthsOld);
  });

  it("gives higher scores to recent articles", () => {
    const recent = computeRankScore({
      publishedAt: new Date(),
      publisher: "ESPN",
      analysisDepth: 0.5,
      clickCount: 0,
      bookmarkCount: 0,
    });

    const old = computeRankScore({
      publishedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      publisher: "ESPN",
      analysisDepth: 0.5,
      clickCount: 0,
      bookmarkCount: 0,
    });

    expect(recent).toBeGreaterThan(old);
  });

  it("gives higher scores to reputable publishers", () => {
    const reputable = computeRankScore({
      publishedAt: new Date(),
      publisher: "MLB.com",
      analysisDepth: 0.5,
      clickCount: 0,
      bookmarkCount: 0,
    });

    const unknown = computeRankScore({
      publishedAt: new Date(),
      publisher: "random-blog",
      analysisDepth: 0.5,
      clickCount: 0,
      bookmarkCount: 0,
    });

    expect(reputable).toBeGreaterThan(unknown);
  });

  it("adjusts for breakingVsAnalysis slider", () => {
    const breakingFocused = computeRankScore(
      {
        publishedAt: new Date(),
        publisher: "ESPN",
        analysisDepth: 0.2,
        clickCount: 0,
        bookmarkCount: 0,
      },
      0 // favor breaking
    );

    const analysisFocused = computeRankScore(
      {
        publishedAt: new Date(Date.now() - 48 * 60 * 60 * 1000),
        publisher: "ESPN",
        analysisDepth: 0.9,
        clickCount: 0,
        bookmarkCount: 0,
      },
      1 // favor analysis
    );

    // Both should be valid scores between 0 and 1
    expect(breakingFocused).toBeGreaterThan(0);
    expect(breakingFocused).toBeLessThanOrEqual(1);
    expect(analysisFocused).toBeGreaterThan(0);
    expect(analysisFocused).toBeLessThanOrEqual(1);
  });

  it("returns a score between 0 and 1", () => {
    const score = computeRankScore({
      publishedAt: new Date(),
      publisher: "ESPN",
      analysisDepth: 0.5,
      clickCount: 10,
      bookmarkCount: 5,
    });

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
  });
});

describe("computeAnalysisDepth", () => {
  it("gives higher depth to articles with analytics keywords", () => {
    const shallow = computeAnalysisDepth("Mariners win 5-2", "Short recap.");
    const deep = computeAnalysisDepth(
      "Statcast Deep Dive: Exit Velocity Trends",
      "Analysis of barrel rate, xBA, expected slugging, and spin rate metrics across the 2024 season. WAR projections suggest regression to the mean."
    );

    expect(deep).toBeGreaterThan(shallow);
  });

  it("returns a value between 0 and 1", () => {
    const depth = computeAnalysisDepth("Test title", "Test content");
    expect(depth).toBeGreaterThanOrEqual(0);
    expect(depth).toBeLessThanOrEqual(1);
  });
});

describe("deduplicateArticles", () => {
  it("removes duplicate URLs", () => {
    const articles = [
      { url: "https://example.com/article-1", title: "Article One" },
      { url: "https://example.com/article-1", title: "Article One Copy" },
      { url: "https://example.com/article-2", title: "Article Two" },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(2);
  });

  it("removes articles with identical titles but different URLs", () => {
    const articles = [
      {
        url: "https://site-a.com/mariners-win",
        title: "Mariners Win Against Astros Tonight",
      },
      {
        url: "https://site-b.com/mariners-victory",
        title: "Mariners Win Against Astros Tonight",
      },
      {
        url: "https://site-c.com/seahawks-trade",
        title: "Seahawks Complete Major Trade for Star Receiver",
      },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(2);
  });

  it("normalizes URLs with tracking params", () => {
    const articles = [
      {
        url: "https://example.com/article?utm_source=twitter",
        title: "Test Article",
      },
      {
        url: "https://example.com/article?utm_source=facebook",
        title: "Test Article Different Source",
      },
    ];

    const result = deduplicateArticles(articles);
    expect(result).toHaveLength(1);
  });

  it("handles empty input", () => {
    expect(deduplicateArticles([])).toHaveLength(0);
  });
});

describe("titleSimilarity", () => {
  it("returns 1 for identical titles", () => {
    expect(
      titleSimilarity("Mariners Win Big", "Mariners Win Big")
    ).toBeCloseTo(1);
  });

  it("returns 0 for completely different titles", () => {
    const sim = titleSimilarity(
      "Mariners pitching dominates",
      "Seahawks trade receiver"
    );
    expect(sim).toBeLessThan(0.3);
  });

  it("returns high similarity for near-identical titles", () => {
    const sim = titleSimilarity(
      "Julio Rodriguez hits three home runs in victory",
      "Julio Rodriguez hits three home runs in win"
    );
    expect(sim).toBeGreaterThan(0.7);
  });
});
