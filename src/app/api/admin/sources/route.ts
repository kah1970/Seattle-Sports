import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { createAdapterRegistry } from "@/lib/sources";

/**
 * GET /api/admin/sources
 *
 * Returns per-source health data including lastFetchAt, lastError,
 * fetchCount, and errorCount for the admin dashboard.
 */
export async function GET() {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      slug: true,
      type: true,
      url: true,
      reputation: true,
      enabled: true,
      lastFetchAt: true,
      lastError: true,
      fetchCount: true,
      errorCount: true,
      createdAt: true,
      _count: { select: { articles: true } },
    },
  });

  // Run live health checks on all configured adapters
  const registry = createAdapterRegistry();
  const healthChecks: Record<string, { ok: boolean; message: string }> = {};

  await Promise.allSettled(
    [...registry.news, ...registry.scores].map(async (adapter) => {
      try {
        healthChecks[adapter.name] = await adapter.healthCheck();
      } catch (err) {
        healthChecks[adapter.name] = {
          ok: false,
          message: err instanceof Error ? err.message : "Health check failed",
        };
      }
    })
  );

  return NextResponse.json({ sources, healthChecks });
}

