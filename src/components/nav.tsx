"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const teamLinks = [
  { href: "/team/mariners", label: "Mariners", color: "var(--team-mariners)" },
  { href: "/team/seahawks", label: "Seahawks", color: "var(--team-seahawks)" },
  { href: "/team/supersonics", label: "SuperSonics", color: "var(--team-supersonics)" },
  { href: "/team/cougars", label: "Cougars", color: "var(--team-cougars)" },
];

const toolLinks = [
  { href: "/search", label: "Search" },
  { href: "/search/players", label: "Players" },
  { href: "/search/players/date", label: "By Date" },
  { href: "/digest", label: "Digest" },
  { href: "/bookmarks", label: "Saved" },
];

// Longest matching href wins, so /search/players/date doesn't also light up
// "Search" and "Players".
function activeHref(pathname: string): string | null {
  const all = ["/", ...teamLinks.map((l) => l.href), ...toolLinks.map((l) => l.href), "/admin"];
  const matches = all.filter((h) => (h === "/" ? pathname === "/" : pathname.startsWith(h)));
  return matches.sort((a, b) => b.length - a.length)[0] ?? null;
}

export function Nav() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const active = activeHref(pathname);

  // Carry filter params (time, type, align) across team page navigations
  function buildHref(href: string): string {
    if (!href.startsWith("/team/")) return href;
    const filterKeys = ["time", "type", "align"];
    const params = new URLSearchParams();
    for (const key of filterKeys) {
      const val = searchParams.get(key);
      if (val) params.set(key, val);
    }
    const qs = params.toString();
    return qs ? `${href}?${qs}` : href;
  }

  const linkClass = (href: string) =>
    `relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
      active === href
        ? "bg-white/[0.08] text-white"
        : "text-gray-400 hover:bg-white/5 hover:text-gray-100"
    }`;

  const links = (
    <>
      <Link href="/" className={linkClass("/")}>
        Home
      </Link>
      <span className="mx-1 h-4 w-px shrink-0 bg-white/10" aria-hidden="true" />
      {teamLinks.map((l) => (
        <Link key={l.href} href={buildHref(l.href)} className={`${linkClass(l.href)} flex items-center gap-1.5`}>
          <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: l.color }} aria-hidden="true" />
          {l.label}
        </Link>
      ))}
      <span className="mx-1 h-4 w-px shrink-0 bg-white/10" aria-hidden="true" />
      {toolLinks.map((l) => (
        <Link key={l.href} href={l.href} className={linkClass(l.href)}>
          {l.label}
        </Link>
      ))}
    </>
  );

  return (
    <nav className="sticky top-0 z-50 border-b border-[var(--border)] bg-[#070a12]/80 backdrop-blur-xl">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center gap-4">
          <Link href="/" className="flex shrink-0 items-center gap-2.5" aria-label="Seattle Sports Intel home">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-to-br from-[var(--accent-strong)] to-[#1d428a] text-[13px] font-bold text-white shadow-[0_0_20px_rgba(45,212,191,0.25)]">
              SSI
            </span>
            <span className="hidden leading-tight sm:block">
              <span className="block text-sm font-semibold text-white">Seattle Sports</span>
              <span className="block text-[10px] font-medium uppercase tracking-[0.2em] text-[var(--muted)]">
                Intel
              </span>
            </span>
          </Link>

          {/* Desktop: one row */}
          <div className="hidden flex-1 items-center gap-0.5 lg:flex">{links}</div>

          <Link
            href="/admin"
            className={`ml-auto grid h-8 w-8 shrink-0 place-items-center rounded-full transition-colors ${
              active === "/admin" ? "bg-white/[0.08] text-white" : "text-gray-500 hover:bg-white/5 hover:text-gray-200"
            }`}
            aria-label="Admin"
            title="Admin"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z" />
            </svg>
          </Link>
        </div>

        {/* Phones and tablets: a swipeable second row */}
        <div className="-mx-4 flex items-center gap-0.5 overflow-x-auto px-4 pb-2 lg:hidden [scrollbar-width:none]">
          {links}
        </div>
      </div>
    </nav>
  );
}
