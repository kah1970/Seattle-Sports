import { NextResponse } from "next/server";
import { importCSVDataset, getColumnPresets } from "@/lib/analytics/csv-import";

/**
 * POST /api/import - Import CSV data
 * Body: { csvText, sport, dataType, teamSlug, season?, columnMapping? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { csvText, sport, dataType, teamSlug, season, columnMapping } = body;

    if (!csvText || !sport || !dataType || !teamSlug) {
      return NextResponse.json(
        { error: "csvText, sport, dataType, and teamSlug are required" },
        { status: 400 }
      );
    }

    const mapping = columnMapping || getColumnPresets(dataType);

    const result = await importCSVDataset(csvText, {
      sport,
      dataType,
      teamSlug,
      season,
      columnMapping: mapping,
    });

    return NextResponse.json({
      success: true,
      ...result,
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Import failed" },
      { status: 500 }
    );
  }
}

/**
 * GET /api/import?dataType=batting - Get column presets
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const dataType = searchParams.get("dataType") || "";
  return NextResponse.json({ presets: getColumnPresets(dataType) });
}
