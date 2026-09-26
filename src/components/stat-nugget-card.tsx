interface StatNuggetCardProps {
  title: string;
  body: string;
  category: string;
  sport: string;
  teamSlug: string;
}

const categoryLabels: Record<string, string> = {
  fun_fact: "Fun fact",
  milestone: "Milestone",
  trend: "Trend",
  comparison: "Comparison",
};

const teamNames: Record<string, string> = {
  mariners: "Mariners",
  seahawks: "Seahawks",
  supersonics: "SuperSonics",
  cougars: "Cougars",
};

export function StatNuggetCard({ title, body, category, sport, teamSlug }: StatNuggetCardProps) {
  return (
    <div className="card relative overflow-hidden">
      {/* thin team-color rule down the left edge */}
      <span
        className="absolute inset-y-4 left-0 w-0.5 rounded-full"
        style={{ background: `var(--team-${teamSlug}, var(--accent))` }}
        aria-hidden="true"
      />
      <div className="flex items-center justify-between gap-2 pl-2">
        <span className="eyebrow" style={{ color: `var(--team-${teamSlug}, var(--muted))` }}>
          {teamNames[teamSlug] ?? sport}
        </span>
        <span className="text-[11px] text-gray-500">{categoryLabels[category] ?? category}</span>
      </div>
      <h3 className="mt-2 pl-2 text-[15px] font-semibold leading-snug text-white">{title}</h3>
      <p className="mt-1.5 pl-2 text-sm leading-relaxed text-gray-400">{body}</p>
    </div>
  );
}
