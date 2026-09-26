"use client";

import { useState, useCallback } from "react";

interface AlignmentRatingProps {
    articleId: string;
    alignment: number | null;
    predictedAlignment?: number | null;
    compact?: boolean;
}

const labels: Record<number, string> = {
    1: "Not aligned",
    2: "Somewhat",
    3: "Very aligned",
};

const dotColors: Record<number, { bg: string; glow: string; text: string; emoji: string }> = {
    1: { bg: "#ef4444", glow: "0 0 6px 2px rgba(239,68,68,0.6), 0 0 0 3px rgba(239,68,68,0.3)", text: "#f87171", emoji: "🔴" },
    2: { bg: "#eab308", glow: "0 0 6px 2px rgba(234,179,8,0.6), 0 0 0 3px rgba(234,179,8,0.3)", text: "#facc15", emoji: "🟡" },
    3: { bg: "#22c55e", glow: "0 0 6px 2px rgba(34,197,94,0.6), 0 0 0 3px rgba(34,197,94,0.3)", text: "#4ade80", emoji: "🟢" },
};

export function AlignmentRating({
    articleId,
    alignment: initialAlignment,
    predictedAlignment,
    compact,
}: AlignmentRatingProps) {
    const [rating, setRating] = useState<number | null>(initialAlignment);
    const [saving, setSaving] = useState(false);
    const [hoveredDot, setHoveredDot] = useState<number | null>(null);

    const effectiveRating = rating;
    const hasRating = effectiveRating !== null;

    const handleClick = useCallback(
        async (e: React.MouseEvent, value: number) => {
            e.preventDefault();
            e.stopPropagation();
            if (saving) return;

            const newValue = rating === value ? null : value;
            setRating(newValue);
            setSaving(true);

            try {
                const res = await fetch("/api/articles/alignment", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ articleId, alignment: newValue }),
                });
                if (!res.ok) {
                    setRating(rating);
                }
            } catch {
                setRating(rating);
            } finally {
                setSaving(false);
            }
        },
        [articleId, rating, saving]
    );

    const dots = [1, 2, 3] as const;

    function getDotStyle(v: number, isCompact: boolean): React.CSSProperties {
        const isActive = effectiveRating === v;
        const isPredicted = !effectiveRating && predictedAlignment === v;
        const isHovered = hoveredDot === v;
        // Unrated dots stay small and quiet so they don't compete with headlines
        const baseSize = isCompact ? 7 : 9;

        if (isActive) {
            return {
                backgroundColor: dotColors[v].bg,
                boxShadow: dotColors[v].glow,
                width: isCompact ? 12 : 16,
                height: isCompact ? 12 : 16,
                opacity: saving ? 0.5 : 1,
            };
        }
        // When a rating is set, make non-selected dots smaller and dimmer
        if (hasRating) {
            return {
                backgroundColor: "#1f2937",
                width: isCompact ? 6 : 8,
                height: isCompact ? 6 : 8,
                opacity: isHovered ? 0.7 : 0.3,
            };
        }
        if (isPredicted) {
            return {
                backgroundColor: dotColors[v].bg,
                boxShadow: `0 0 0 1px rgba(255,255,255,0.1)`,
                width: baseSize,
                height: baseSize,
                opacity: 0.35,
            };
        }
        if (isHovered) {
            return {
                backgroundColor: "rgba(255,255,255,0.5)",
                width: baseSize,
                height: baseSize,
                opacity: saving ? 0.5 : 1,
            };
        }
        return {
            backgroundColor: "rgba(255,255,255,0.14)",
            width: baseSize,
            height: baseSize,
            opacity: saving ? 0.5 : 1,
        };
    }

    if (compact) {
        return (
            <div
                className="inline-flex items-center gap-1"
                onClick={(e) => e.stopPropagation()}
                title={
                    effectiveRating
                        ? `Rated: ${labels[effectiveRating]}`
                        : predictedAlignment
                            ? `Auto: ${labels[predictedAlignment]}`
                            : "Rate alignment"
                }
            >
                {dots.map((v) => (
                    <button
                        key={v}
                        onClick={(e) => handleClick(e, v)}
                        onMouseEnter={() => setHoveredDot(v)}
                        onMouseLeave={() => setHoveredDot(null)}
                        disabled={saving}
                        className="rounded-full transition-all duration-150 cursor-pointer"
                        style={getDotStyle(v, true)}
                    />
                ))}
                {effectiveRating && (
                    <span className="text-xs ml-0.5" style={{ fontSize: "10px" }}>
                        {dotColors[effectiveRating].emoji}
                    </span>
                )}
            </div>
        );
    }

    return (
        <div
            className="inline-flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
        >
            {dots.map((v) => (
                <button
                    key={v}
                    onClick={(e) => handleClick(e, v)}
                    onMouseEnter={() => setHoveredDot(v)}
                    onMouseLeave={() => setHoveredDot(null)}
                    disabled={saving}
                    title={labels[v]}
                    className="rounded-full transition-all duration-150 cursor-pointer"
                    style={getDotStyle(v, false)}
                />
            ))}
            {effectiveRating && (
                <span
                    className="text-xs font-semibold ml-1 px-1.5 py-0.5 rounded-full"
                    style={{
                        color: dotColors[effectiveRating].text,
                        backgroundColor: `${dotColors[effectiveRating].bg}20`,
                        border: `1px solid ${dotColors[effectiveRating].bg}40`,
                    }}
                >
                    {labels[effectiveRating]}
                </span>
            )}
            {!effectiveRating && predictedAlignment && (
                <span className="text-xs ml-0.5 text-gray-600">
                    🤖 {labels[predictedAlignment]}
                </span>
            )}
        </div>
    );
}

