"use client";

import { useState } from "react";

interface BookmarkButtonProps {
  articleId: string;
  isBookmarked: boolean;
}

export function BookmarkButton({
  articleId,
  isBookmarked: initial,
}: BookmarkButtonProps) {
  const [bookmarked, setBookmarked] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      const res = await fetch("/api/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ articleId }),
      });
      const data = await res.json();
      setBookmarked(data.bookmarked);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
        bookmarked
          ? "bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30"
          : "bg-white/5 text-gray-400 hover:bg-white/10 hover:text-gray-200"
      }`}
      aria-label={bookmarked ? "Remove bookmark" : "Add bookmark"}
    >
      {loading ? "..." : bookmarked ? "Bookmarked" : "Bookmark"}
    </button>
  );
}
