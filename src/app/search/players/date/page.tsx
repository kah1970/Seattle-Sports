import { DateSearchClient } from "./date-search-client";

export const metadata = {
    title: "Single Date Search - Postgame Stats",
    description: "Search for a player's stats on a specific date",
};

export default function DateSearchPage() {
    return (
        <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full">
            <div className="flex justify-between items-center bg-[var(--card)] border border-[var(--border)] rounded-xl p-6">
                <div>
                    <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">Single Date Player Stats</h1>
                    <p className="text-gray-400">Find NBA stats and generate shot charts for a specific game date.</p>
                </div>
            </div>

            <DateSearchClient />
        </div>
    );
}
