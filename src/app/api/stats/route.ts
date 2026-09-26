import { NextResponse } from "next/server";
import { fetchTeamStats } from "@/lib/stats";

/**
 * GET /api/stats
 *
 * Query params:
 *   team  — "mariners" | "seahawks" | "supersonics"  (required)
 *   type  — "all" | "roster" | "leaders"              (default: "all")
 *
 * Returns live stats from:
 *   - MLB Stats API (statsapi.mlb.com) for Mariners
 *   - ESPN unofficial API (site.api.espn.com) for Seahawks
 *   - Expansion bid summary for SuperSonics
 *
 * All responses are cached at the fetch layer (1–2 hours).
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const team = searchParams.get("team");
    const type = searchParams.get("type") ?? "all";

    const validTeams = ["mariners", "seahawks", "supersonics"];
    if (!team || !validTeams.includes(team)) {
        return NextResponse.json(
            { error: `team param required. Valid: ${validTeams.join(", ")}` },
            { status: 400 }
        );
    }

    const stats = await fetchTeamStats(team);

    // Filter by type if requested
    if (type === "roster") {
        const { leaders: _l, ...rest } = stats;
        return NextResponse.json({ ...rest, _l });
    }
    if (type === "leaders") {
        const { roster: _r, ...rest } = stats;
        return NextResponse.json({ ...rest, _r });
    }

    return NextResponse.json(stats);
}

export const dynamic = "force-dynamic";
export const maxDuration = 15;
