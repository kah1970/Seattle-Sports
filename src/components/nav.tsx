"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Dashboard" },
  { href: "/team/mariners", label: "Mariners" },
  { href: "/team/seahawks", label: "Seahawks" },
  { href: "/team/supersonics", label: "SuperSonics" },
  { href: "/search", label: "Search" },
  { href: "/bookmarks", label: "Bookmarks" },
  { href: "/digest", label: "Digest" },
];

export function Nav() {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 bg-[#0a0e1a]/95 backdrop-blur border-b border-[var(--border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          <Link
            href="/"
            className="font-bold text-lg tracking-tight flex items-center gap-2"
          >
            <span className="text-blue-400">SSI</span>
            <span className="hidden sm:inline text-sm font-normal text-gray-400">
              Seattle Sports Intel
            </span>
          </Link>

          <div className="flex items-center gap-1 overflow-x-auto">
            {links.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/" && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                    isActive
                      ? "bg-blue-500/20 text-blue-400"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            <Link
              href="/admin"
              className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
            >
              Admin
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
