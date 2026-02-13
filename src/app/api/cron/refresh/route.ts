import { NextResponse } from "next/server";
import { runIngestion } from "@/lib/ingestion";

/**
 * Cron-friendly endpoint for refreshing all data sources.
 * Safe to run on Vercel Cron (add to vercel.json).
 *
 * GET /api/cron/refresh
 * Optional: ?secret=YOUR_CRON_SECRET for production auth
 */
export async function GET(request: Request) {
  // Simple secret-based auth for cron jobs
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && secret !== cronSecret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runIngestion();

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      ...result,
    });
  } catch (error) {
    console.error("[Cron Refresh] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export const dynamic = "force-dynamic";
export const maxDuration = 60;
