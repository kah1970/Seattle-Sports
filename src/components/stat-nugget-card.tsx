interface StatNuggetCardProps {
  title: string;
  body: string;
  category: string;
  sport: string;
  teamSlug: string;
}

const categoryIcons: Record<string, string> = {
  fun_fact: "?",
  milestone: "!",
  trend: "~",
  comparison: "vs",
};

const sportColors: Record<string, string> = {
  MLB: "from-teal-600/20 to-blue-600/20 border-teal-700/30",
  NFL: "from-green-600/20 to-blue-600/20 border-green-700/30",
  NBA: "from-yellow-600/20 to-blue-600/20 border-yellow-700/30",
};

export function StatNuggetCard({
  title,
  body,
  category,
  sport,
}: StatNuggetCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 bg-gradient-to-br ${sportColors[sport] || "from-gray-600/20 to-gray-700/20 border-gray-700/30"}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-xs font-bold text-white/70">
          {categoryIcons[category] || "i"}
        </span>
        <div>
          <span className="text-xs uppercase tracking-wider text-gray-400">
            Stat Nugget
          </span>
          <span className="text-xs text-gray-600 ml-2">{sport}</span>
        </div>
      </div>
      <h3 className="text-sm font-semibold text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-300 leading-relaxed">{body}</p>
    </div>
  );
}
