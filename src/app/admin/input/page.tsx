"use client";

import { useState } from "react";

type TeamSlug = "mariners" | "seahawks" | "supersonics";
type ArticleType = "news" | "analysis" | "opinion" | "highlights" | "spring-training" | "roster-move" | "prospects" | "retrospective";
type Sport = "MLB" | "NFL" | "NBA";

const TEAM_OPTIONS: { value: TeamSlug; label: string; sport: Sport }[] = [
    { value: "mariners", label: "Seattle Mariners", sport: "MLB" },
    { value: "seahawks", label: "Seattle Seahawks", sport: "NFL" },
    { value: "supersonics", label: "Seattle SuperSonics", sport: "NBA" },
];

const ARTICLE_TYPE_OPTIONS: { value: ArticleType; label: string }[] = [
    { value: "news", label: "News" },
    { value: "analysis", label: "Analysis" },
    { value: "opinion", label: "Opinion / Commentary" },
    { value: "spring-training", label: "Spring Training" },
    { value: "roster-move", label: "Roster Move" },
    { value: "prospects", label: "Prospects" },
    { value: "highlights", label: "Highlights" },
    { value: "retrospective", label: "Retrospective" },
];

const SUGGESTED_TAGS = [
    "spring-training", "prospects", "trades", "free-agency", "injuries", "roster",
    "lineup", "rotation", "bullpen", "playoffs", "draft", "il",
    "julio-rodriguez", "cal-raleigh", "logan-gilbert", "george-kirby", "luis-castillo",
    "geno-smith", "dk-metcalf", "tyler-lockett", "devon-witherspoon", "kenneth-walker",
];

interface FormState {
    title: string;
    url: string;
    teamSlug: TeamSlug;
    sport: Sport;
    articleType: ArticleType;
    summary: string;
    content: string;
    imageUrl: string;
    secret: string;
    tags: string[];
    customTag: string;
}

export default function ManualInputPage() {
    const [form, setForm] = useState<FormState>({
        title: "",
        url: "",
        teamSlug: "mariners",
        sport: "MLB",
        articleType: "analysis",
        summary: "",
        content: "",
        imageUrl: "",
        secret: "",
        tags: [],
        customTag: "",
    });

    const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
    const [message, setMessage] = useState("");

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function onTeamChange(teamSlug: TeamSlug) {
        const team = TEAM_OPTIONS.find((t) => t.value === teamSlug);
        setForm((prev) => ({ ...prev, teamSlug, sport: team?.sport ?? prev.sport }));
    }

    function toggleTag(tag: string) {
        setForm((prev) => ({
            ...prev,
            tags: prev.tags.includes(tag)
                ? prev.tags.filter((t) => t !== tag)
                : [...prev.tags, tag],
        }));
    }

    function addCustomTag() {
        const tag = form.customTag.trim().toLowerCase().replace(/\s+/g, "-");
        if (tag && !form.tags.includes(tag)) {
            setForm((prev) => ({ ...prev, tags: [...prev.tags, tag], customTag: "" }));
        }
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setStatus("loading");
        setMessage("");

        try {
            const res = await fetch("/api/articles/manual", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-cron-secret": form.secret,
                },
                body: JSON.stringify({
                    title: form.title,
                    url: form.url || undefined,
                    teamSlug: form.teamSlug,
                    sport: form.sport,
                    articleType: form.articleType,
                    summary: form.summary || undefined,
                    content: form.content || undefined,
                    imageUrl: form.imageUrl || undefined,
                    tags: form.tags,
                }),
            });

            const data = await res.json();
            if (res.ok) {
                setStatus("success");
                setMessage(`✓ Posted successfully${data.url ? ` — ${data.url}` : ""}`);
                setForm((prev) => ({ ...prev, title: "", url: "", summary: "", content: "", imageUrl: "", tags: [] }));
            } else {
                setStatus("error");
                setMessage(data.error ?? "Unknown error");
            }
        } catch (err) {
            setStatus("error");
            setMessage(err instanceof Error ? err.message : "Network error");
        }
    }

    const inputClass =
        "w-full bg-[#0d1117] border border-[#30363d] rounded-md px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[var(--accent-strong)] transition-colors";
    const labelClass = "block text-xs font-medium text-gray-400 mb-1 uppercase tracking-wide";

    return (
        <div className="min-h-screen bg-[#0d1117] text-white">
            <div className="max-w-2xl mx-auto px-4 py-10">
                <div className="mb-8">
                    <h1 className="text-2xl font-bold">Post a Story</h1>
                    <p className="text-sm text-gray-400 mt-1">
                        Add your own articles, notes, and analysis directly to the feed.
                        Manual posts are ranked #1 by default.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Title */}
                    <div>
                        <label className={labelClass}>Title *</label>
                        <input
                            className={inputClass}
                            placeholder="Article or note title"
                            value={form.title}
                            onChange={(e) => set("title", e.target.value)}
                            required
                        />
                    </div>

                    {/* Team + Type row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className={labelClass}>Team *</label>
                            <select
                                className={inputClass}
                                value={form.teamSlug}
                                onChange={(e) => onTeamChange(e.target.value as TeamSlug)}
                            >
                                {TEAM_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className={labelClass}>Article Type *</label>
                            <select
                                className={inputClass}
                                value={form.articleType}
                                onChange={(e) => set("articleType", e.target.value as ArticleType)}
                            >
                                {ARTICLE_TYPE_OPTIONS.map((t) => (
                                    <option key={t.value} value={t.value}>{t.label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* URL */}
                    <div>
                        <label className={labelClass}>Source URL <span className="text-gray-600">(optional — leave blank for original notes)</span></label>
                        <input
                            className={inputClass}
                            type="url"
                            placeholder="https://..."
                            value={form.url}
                            onChange={(e) => set("url", e.target.value)}
                        />
                    </div>

                    {/* Summary / Notes */}
                    <div>
                        <label className={labelClass}>Summary / Notes</label>
                        <textarea
                            className={`${inputClass} h-20 resize-none`}
                            placeholder="Brief summary or your own take on the story..."
                            value={form.summary}
                            onChange={(e) => set("summary", e.target.value)}
                        />
                    </div>

                    {/* Extended content */}
                    <div>
                        <label className={labelClass}>Full Content / Analysis <span className="text-gray-600">(optional — improves analysis-depth scoring)</span></label>
                        <textarea
                            className={`${inputClass} h-32 resize-none`}
                            placeholder="Paste full article text or write your own analysis here..."
                            value={form.content}
                            onChange={(e) => set("content", e.target.value)}
                        />
                    </div>

                    {/* Image URL */}
                    <div>
                        <label className={labelClass}>Image URL <span className="text-gray-600">(optional)</span></label>
                        <input
                            className={inputClass}
                            type="url"
                            placeholder="https://..."
                            value={form.imageUrl}
                            onChange={(e) => set("imageUrl", e.target.value)}
                        />
                    </div>

                    {/* Tags */}
                    <div>
                        <label className={labelClass}>Tags</label>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {SUGGESTED_TAGS.map((tag) => (
                                <button
                                    key={tag}
                                    type="button"
                                    onClick={() => toggleTag(tag)}
                                    className={`px-2 py-0.5 rounded-full text-xs transition-colors ${form.tags.includes(tag)
                                            ? "bg-[var(--accent-strong)] text-[var(--accent-ink)]"
                                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                                        }`}
                                >
                                    {tag}
                                </button>
                            ))}
                        </div>
                        <div className="flex gap-2">
                            <input
                                className={`${inputClass} flex-1`}
                                placeholder="Custom tag..."
                                value={form.customTag}
                                onChange={(e) => set("customTag", e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCustomTag())}
                            />
                            <button
                                type="button"
                                onClick={addCustomTag}
                                className="px-3 py-2 bg-white/5 rounded-md text-sm text-gray-300 hover:bg-white/10 transition-colors"
                            >
                                Add
                            </button>
                        </div>
                        {form.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {form.tags.map((tag) => (
                                    <span
                                        key={tag}
                                        className="flex items-center gap-1 px-2 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full text-xs"
                                    >
                                        {tag}
                                        <button type="button" onClick={() => toggleTag(tag)} className="hover:text-white">×</button>
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Secret */}
                    <div>
                        <label className={labelClass}>Admin Secret *</label>
                        <input
                            className={inputClass}
                            type="password"
                            placeholder="CRON_SECRET value"
                            value={form.secret}
                            onChange={(e) => set("secret", e.target.value)}
                            required
                        />
                    </div>

                    {/* Status message */}
                    {status !== "idle" && status !== "loading" && (
                        <div className={`text-sm px-3 py-2 rounded-md ${status === "success"
                                ? "bg-green-900/40 text-green-300"
                                : "bg-red-900/40 text-red-300"
                            }`}>
                            {message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={status === "loading"}
                        className="w-full py-2.5 bg-[var(--accent-strong)] hover:bg-[var(--accent)] text-[var(--accent-ink)] disabled:opacity-50 rounded-md font-medium text-sm transition-colors"
                    >
                        {status === "loading" ? "Posting…" : "Post to Feed"}
                    </button>
                </form>
            </div>
        </div>
    );
}
