import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { storeManualArticle } from "@/lib/ingestion";

/**
 * POST /api/articles/manual
 *
 * Lets the app owner post their own stories (notes, links, analysis)
 * directly into the feed. Articles are ranked with publisher reputation 100
 * so manual entries surface at the top.
 *
 * Auth: requires CRON_SECRET header (same pattern as cron endpoint).
 *
 * Body (JSON):
 *   title        string  required
 *   teamSlug     string  required  ("mariners" | "seahawks" | "supersonics")
 *   sport        string  required  ("MLB" | "NFL" | "NBA")
 *   url          string  optional  (leave blank for original notes; a unique ID is generated)
 *   summary      string  optional
 *   content      string  optional
 *   imageUrl     string  optional
 *   articleType  string  optional  default: "analysis"
 *   tags         string[] optional
 */
export async function POST(request: Request) {
    // Auth check
    const secret = request.headers.get("x-cron-secret");
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && secret !== cronSecret) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let body: Record<string, unknown>;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const title = typeof body.title === "string" ? body.title.trim() : "";
    const teamSlug = typeof body.teamSlug === "string" ? body.teamSlug : "";
    const sport = typeof body.sport === "string" ? body.sport : "";

    if (!title || !teamSlug || !sport) {
        return NextResponse.json(
            { error: "title, teamSlug, and sport are required" },
            { status: 400 }
        );
    }

    // Verify team exists
    const team = await prisma.team.findUnique({ where: { slug: teamSlug } });
    if (!team) {
        return NextResponse.json({ error: `Unknown team slug: ${teamSlug}` }, { status: 400 });
    }

    const url =
        typeof body.url === "string" && body.url.trim()
            ? body.url.trim()
            : `manual://${teamSlug}/${Date.now()}/${encodeURIComponent(title.slice(0, 40))}`;

    const articleType =
        typeof body.articleType === "string" ? body.articleType : "analysis";
    const tags = Array.isArray(body.tags)
        ? (body.tags as unknown[]).filter((t): t is string => typeof t === "string")
        : [];

    try {
        const result = await storeManualArticle({
            title,
            url,
            publisher: "Manual Input",
            publishedAt: new Date(),
            summary: typeof body.summary === "string" ? body.summary : undefined,
            content: typeof body.content === "string" ? body.content : undefined,
            imageUrl: typeof body.imageUrl === "string" ? body.imageUrl : undefined,
            sport,
            teamSlug,
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            articleType: articleType as any,
            isHighlight: false,
            tags,
        });

        if (!result) {
            return NextResponse.json(
                { error: "Article already exists (duplicate URL)" },
                { status: 409 }
            );
        }

        return NextResponse.json({ success: true, url }, { status: 201 });
    } catch (err) {
        console.error("[Manual Input] Error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
