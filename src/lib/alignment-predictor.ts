import { prisma } from "./db";
import { TEAM_KEYWORDS } from "./config";

/**
 * In-memory cache of learned negative keywords per team.
 * Built from articles the user has rated as misaligned (alignment = 1).
 * Words that appear in low-rated titles but rarely in high-rated titles
 * become negative signals for that team.
 */
let learnedNegativeKeywords: Map<string, Set<string>> = new Map();

/** Common stop words to exclude from keyword learning */
const STOP_WORDS = new Set([
    "the", "a", "an", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "have", "has", "had", "do", "does", "did", "will", "would", "could",
    "should", "may", "might", "can", "shall", "not", "no", "it", "its",
    "this", "that", "these", "those", "he", "she", "they", "we", "you",
    "his", "her", "their", "our", "my", "your", "who", "which", "what",
    "when", "where", "how", "why", "all", "each", "every", "both", "few",
    "more", "most", "other", "some", "such", "than", "too", "very", "just",
    "about", "after", "as", "into", "over", "up", "out", "new", "also",
    "first", "last", "get", "go", "see", "say", "said", "vs", "via",
]);

/**
 * Extract meaningful words from text for keyword analysis.
 */
function extractWords(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s'-]/g, " ")
        .split(/\s+/)
        .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

/**
 * Count how many keyword matches appear in text for a given team.
 */
function countTeamMentions(text: string, teamSlug: string): number {
    const lower = text.toLowerCase();
    const keywords = TEAM_KEYWORDS[teamSlug] || [];
    let count = 0;
    for (const kw of keywords) {
        // Count all occurrences of this keyword
        let idx = 0;
        while ((idx = lower.indexOf(kw, idx)) !== -1) {
            count++;
            idx += kw.length;
        }
    }
    return count;
}

/**
 * Count keyword matches for all OTHER teams (not the assigned team).
 */
function countOtherTeamMentions(text: string, teamSlug: string): number {
    let count = 0;
    for (const [slug, keywords] of Object.entries(TEAM_KEYWORDS)) {
        if (slug === teamSlug) continue;
        const lower = text.toLowerCase();
        for (const kw of keywords) {
            let idx = 0;
            while ((idx = lower.indexOf(kw, idx)) !== -1) {
                count++;
                idx += kw.length;
            }
        }
    }
    return count;
}

/**
 * Count how many learned negative keywords appear in the text.
 */
function countNegativeKeywordHits(text: string, teamSlug: string): number {
    const negatives = learnedNegativeKeywords.get(teamSlug);
    if (!negatives || negatives.size === 0) return 0;

    const words = new Set(extractWords(text));
    let hits = 0;
    for (const neg of Array.from(negatives)) {
        if (words.has(neg)) hits++;
    }
    return hits;
}

/**
 * Predict alignment for an article based on content analysis.
 *
 * Scoring logic:
 * - Count own-team keyword mentions vs other-team keyword mentions
 * - Check for learned negative keywords from user feedback
 * - Combine signals into a 1-3 prediction
 */
export function predictAlignment(
    title: string,
    summary: string | null | undefined,
    teamSlug: string
): number {
    const text = `${title} ${summary || ""}`;

    const ownMentions = countTeamMentions(text, teamSlug);
    const otherMentions = countOtherTeamMentions(text, teamSlug);
    const negativeHits = countNegativeKeywordHits(text, teamSlug);

    // Score starts at 2 (neutral)
    let score = 2;

    // Strong own-team signal → boost to 3
    if (ownMentions >= 2) score += 1;
    else if (ownMentions === 1) score += 0.5;

    // Other teams mentioned more than own team → drop
    if (otherMentions > ownMentions && otherMentions >= 2) score -= 1;
    else if (otherMentions > 0 && ownMentions === 0) score -= 0.5;

    // Learned negative keywords → further penalty
    if (negativeHits >= 2) score -= 1;
    else if (negativeHits === 1) score -= 0.5;

    // Clamp to 1-3
    return Math.max(1, Math.min(3, Math.round(score)));
}

/**
 * Rebuild the learned negative keywords from all user-rated articles.
 *
 * Logic: extract words from titles of articles rated 1 (bad alignment)
 * and subtract words that also frequently appear in articles rated 3.
 * The remaining words are negative signals for that team.
 */
export async function rebuildLearnedKeywords(): Promise<void> {
    const ratedArticles = await prisma.article.findMany({
        where: { alignment: { not: null } },
        select: { title: true, alignment: true, teamId: true, team: { select: { slug: true } } },
    });

    const newMap = new Map<string, Set<string>>();

    // Group rated articles by team
    const byTeam = new Map<string, { good: string[]; bad: string[] }>();
    for (const a of ratedArticles) {
        const slug = a.team.slug;
        if (!byTeam.has(slug)) byTeam.set(slug, { good: [], bad: [] });
        const group = byTeam.get(slug)!;
        if (a.alignment === 1) group.bad.push(a.title);
        else if (a.alignment === 3) group.good.push(a.title);
    }

    for (const [slug, { good, bad }] of Array.from(byTeam)) {
        if (bad.length === 0) continue;

        // Count word frequencies in bad-rated titles
        const badWordCounts = new Map<string, number>();
        for (const title of bad) {
            for (const word of extractWords(title)) {
                badWordCounts.set(word, (badWordCounts.get(word) || 0) + 1);
            }
        }

        // Count word frequencies in good-rated titles
        const goodWords = new Set<string>();
        for (const title of good) {
            for (const word of extractWords(title)) {
                goodWords.add(word);
            }
        }

        // Also exclude existing team keywords (they're already positive signals)
        const teamKws = new Set((TEAM_KEYWORDS[slug] || []).map((k) => k.toLowerCase()));

        // Negative keywords = words in bad titles that aren't in good titles
        // and aren't team keywords, with at least 1 occurrence
        const negatives = new Set<string>();
        for (const [word, count] of Array.from(badWordCounts)) {
            if (count >= 1 && !goodWords.has(word) && !teamKws.has(word)) {
                negatives.add(word);
            }
        }

        if (negatives.size > 0) {
            newMap.set(slug, negatives);
        }
    }

    learnedNegativeKeywords = newMap;
    console.log(
        `[alignment-predictor] Rebuilt learned keywords:`,
        Object.fromEntries(Array.from(newMap).map(([k, v]) => [k, Array.from(v)]))
    );
}

/**
 * Re-predict alignment for all articles that don't have a manual rating.
 * Useful after the learned keywords are rebuilt.
 */
export async function repredictUnratedArticles(): Promise<number> {
    const articles = await prisma.article.findMany({
        where: { alignment: null },
        select: { id: true, title: true, summary: true, team: { select: { slug: true } } },
    });

    let updated = 0;
    for (const a of articles) {
        const predicted = predictAlignment(a.title, a.summary, a.team.slug);
        await prisma.article.update({
            where: { id: a.id },
            data: { predictedAlignment: predicted },
        });
        updated++;
    }

    return updated;
}
