import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { rebuildLearnedKeywords, repredictUnratedArticles } from "@/lib/alignment-predictor";

/**
 * PATCH /api/articles/alignment
 * Save or clear a manual alignment rating for an article.
 * Body: { articleId: string, alignment: 1 | 2 | 3 | null }
 *
 * After saving, rebuilds the learned keyword model and re-predicts
 * alignment for unrated articles.
 */
export async function PATCH(request: Request) {
    try {
        const body = await request.json();
        const { articleId, alignment } = body;

        if (!articleId || typeof articleId !== "string") {
            return NextResponse.json({ error: "articleId is required" }, { status: 400 });
        }

        if (alignment !== null && ![1, 2, 3].includes(alignment)) {
            return NextResponse.json(
                { error: "alignment must be 1, 2, 3, or null" },
                { status: 400 }
            );
        }

        const article = await prisma.article.findUnique({ where: { id: articleId } });
        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        await prisma.article.update({
            where: { id: articleId },
            data: { alignment },
        });

        // Rebuild learned keywords and re-predict in the background
        // (don't block the response)
        rebuildLearnedKeywords()
            .then(() => repredictUnratedArticles())
            .catch((err) => console.error("[alignment] rebuild error:", err));

        return NextResponse.json({ success: true, articleId, alignment });
    } catch (err) {
        console.error("[alignment] error:", err);
        return NextResponse.json(
            { error: err instanceof Error ? err.message : "Unknown error" },
            { status: 500 }
        );
    }
}
