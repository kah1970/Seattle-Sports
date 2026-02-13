import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAdapterRegistry } from "@/lib/sources";

/**
 * GET /api/admin/sources - Source health dashboard data
 */
export async function GET() {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { articles: true } },
    },
  });

  // Run health checks on adapters
  const registry = createAdapterRegistry();
  const healthChecks: Record<string, { ok: boolean; message: string }> = {};

  for (const adapter of [...registry.news, ...registry.scores]) {
    try {
      healthChecks[adapter.name] = await adapter.healthCheck();
    } catch {
      healthChecks[adapter.name] = { ok: false, message: "Health check failed" };
    }
  }

  return NextResponse.json({ sources, healthChecks });
}
