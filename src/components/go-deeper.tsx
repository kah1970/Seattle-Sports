import { ResearchLink } from "@/lib/config";

export function GoDeeper({ links }: { links: ResearchLink[] }) {
  if (links.length === 0) return null;

  return (
    <div className="card hover:bg-[var(--card)]" data-testid="go-deeper">
      <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">
        Go Deeper
      </h2>
      <ul className="space-y-2">
        {links.map((link) => (
          <li key={link.url}>
            <a
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group block rounded-md px-2 py-1.5 -mx-2 hover:bg-white/5 transition-colors"
            >
              <span className="text-sm font-medium text-blue-400 group-hover:underline">
                {link.label} ↗
              </span>
              <span className="block text-xs text-gray-500">
                {link.description}
              </span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
