import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * GET /api/articles
 * Query params:
 *   team, sport, type, search, sort, limit, offset, depth_min, depth_max
 *   timeWindow: "week" (default) | "month" | "year" | "all"
 *   time: legacy alias — "24h" | "7d" | "30d" (still supported)
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const team = searchParams.get("team");
  const sport = searchParams.get("sport");
  const type = searchParams.get("type");
  const search = searchParams.get("search");
  const sort = searchParams.get("sort") || "rank";
  const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");
  const depthMin = parseFloat(searchParams.get("depth_min") || "0");
  const depthMax = parseFloat(searchParams.get("depth_max") || "1");

  // Time-window support: prefer new "timeWindow" param, fall back to legacy "time"
  const timeWindow = searchParams.get("timeWindow");
  const legacyTime = searchParams.get("time"); // "24h" | "7d" | "30d"

  const where: Record<string, unknown> = {};

  if (team) {
    where.team = { slug: team };
  }
  if (sport) {
    where.sport = sport;
  }
  if (type) {
    where.articleType = type;
  }
  if (search) {
    where.OR = [
      { title: { contains: search } },
      { summary: { contains: search } },
    ];
  }
  if (depthMin > 0 || depthMax < 1) {
    where.analysisDepth = {
      gte: depthMin,
      lte: depthMax,
    };
  }

  // Resolve time cutoff — timeWindow takes priority over legacy param
  const now = new Date();
  let since: Date | null = null;

  if (timeWindow) {
    switch (timeWindow) {
      case "week":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "month":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "year":
        since = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "all":
      default:
        since = null;
    }
  } else if (legacyTime) {
    switch (legacyTime) {
      case "24h":
        since = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "7d":
        since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "30d":
        since = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
    }
  } else {
    // Default: this week (7 days)
    since = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  }

  if (since) {
    where.publishedAt = { gte: since };
  }

  const orderBy =
    sort === "date"
      ? { publishedAt: "desc" as const }
      : sort === "depth"
        ? { analysisDepth: "desc" as const }
        : { rankScore: "desc" as const };

  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      take: limit,
      skip: offset,
      include: {
        team: { select: { name: true, slug: true, sport: true } },
        source: { select: { name: true, reputation: true } },
        tags: { select: { name: true, slug: true } },
        _count: { select: { bookmarks: true } },
      },
    }),
    prisma.article.count({ where }),
  ]);

  return NextResponse.json({
    articles,
    total,
    limit,
    offset,
    timeWindow: timeWindow ?? (legacyTime ? "custom" : "week"),
  });
}
