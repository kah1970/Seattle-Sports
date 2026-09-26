import Image from "next/image";

export interface Championship {
  title: string;
  season: string;
  record: string;
  highlights: readonly string[];
  /** Optional photos in /public (e.g. "/champions/trophy.jpg"). */
  photos?: readonly { src: string; alt: string }[];
}

/** Stylized championship trophy: a football atop a tapered silver stand. */
function TrophyArt() {
  return (
    <svg viewBox="0 0 120 200" className="h-40 w-auto drop-shadow-[0_0_18px_rgba(226,232,240,0.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="silver" x1="0" x2="1">
          <stop offset="0" stopColor="#7c8794" />
          <stop offset="0.35" stopColor="#f8fafc" />
          <stop offset="0.6" stopColor="#cbd5e1" />
          <stop offset="1" stopColor="#64748b" />
        </linearGradient>
        <linearGradient id="base" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#1e293b" />
          <stop offset="1" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      {/* football, tilted as if about to be thrown */}
      <g transform="rotate(-35 60 45)">
        <ellipse cx="60" cy="45" rx="30" ry="17" fill="url(#silver)" />
        <path d="M44 45 H76" stroke="#94a3b8" strokeWidth="1.5" />
        {[50, 55, 60, 65, 70].map((x) => (
          <path key={x} d={`M${x} 41 V49`} stroke="#94a3b8" strokeWidth="1.5" />
        ))}
      </g>
      {/* stand */}
      <path d="M56 62 L64 62 L70 150 L50 150 Z" fill="url(#silver)" />
      <path d="M60 62 L62 150" stroke="#f8fafc" strokeOpacity="0.6" strokeWidth="1" />
      {/* plinth */}
      <rect x="38" y="150" width="44" height="10" rx="2" fill="url(#silver)" />
      <rect x="32" y="160" width="56" height="30" rx="3" fill="url(#base)" stroke="#69BE28" strokeOpacity="0.6" />
      <text x="60" y="179" textAnchor="middle" fontSize="9" fontWeight="700" fill="#69BE28" letterSpacing="1">
        SEATTLE
      </text>
    </svg>
  );
}

/** Stylized championship ring: gold band with a green stone and diamonds. */
function RingArt() {
  return (
    <svg viewBox="0 0 120 120" className="h-24 w-auto drop-shadow-[0_0_14px_rgba(250,204,21,0.35)]" aria-hidden="true">
      <defs>
        <linearGradient id="gold" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0" stopColor="#a16207" />
          <stop offset="0.4" stopColor="#fde68a" />
          <stop offset="0.7" stopColor="#facc15" />
          <stop offset="1" stopColor="#854d0e" />
        </linearGradient>
        <radialGradient id="stone">
          <stop offset="0" stopColor="#bef264" />
          <stop offset="1" stopColor="#3f6212" />
        </radialGradient>
      </defs>
      {/* band */}
      <ellipse cx="60" cy="72" rx="36" ry="34" fill="none" stroke="url(#gold)" strokeWidth="12" />
      {/* crown */}
      <rect x="30" y="18" width="60" height="40" rx="12" fill="url(#gold)" />
      <rect x="36" y="24" width="48" height="28" rx="8" fill="#0f172a" />
      <circle cx="60" cy="38" r="9" fill="url(#stone)" />
      {/* diamond border */}
      {[42, 50, 70, 78].map((x) => (
        <circle key={x} cx={x} cy="38" r="3" fill="#f8fafc" />
      ))}
      {[44, 52, 60, 68, 76].map((x) => (
        <circle key={`t${x}`} cx={x} cy="28" r="2" fill="#f8fafc" />
      ))}
      {[44, 52, 60, 68, 76].map((x) => (
        <circle key={`b${x}`} cx={x} cy="48" r="2" fill="#f8fafc" />
      ))}
    </svg>
  );
}

export function ChampionsBanner({ championship }: { championship: Championship }) {
  const photos = championship.photos ?? [];

  return (
    <div
      className="champions-banner relative overflow-hidden rounded-xl border border-yellow-400/40 p-6"
      data-testid="champions-banner"
    >
      <div className="relative flex flex-col md:flex-row items-center gap-6">
        {photos.length > 0 ? (
          <div className="flex gap-3 shrink-0">
            {photos.map((p) => (
              <div key={p.src} className="relative h-40 w-32 overflow-hidden rounded-lg border border-yellow-400/30">
                <Image src={p.src} alt={p.alt} fill className="object-cover" />
              </div>
            ))}
          </div>
        ) : (
          <div className="flex items-end gap-2 shrink-0">
            <TrophyArt />
            <RingArt />
          </div>
        )}

        <div className="text-center md:text-left">
          <div className="text-xs font-semibold uppercase tracking-[0.2em] text-yellow-300/80">
            {championship.season} season · {championship.record}
          </div>
          <h2 className="champions-title mt-1 text-3xl md:text-4xl font-extrabold tracking-tight">
            {championship.title}
          </h2>
          <ul className="mt-3 space-y-1">
            {championship.highlights.map((h) => (
              <li key={h} className="text-sm text-gray-300">
                {h}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
