import { PlayerSearchClient } from "./player-search-client";

export const metadata = {
    title: "Player Stats Search",
    description: "Search for in-depth player statistics via Postgame Stats API",
};

export default function PlayerSearchPage() {
    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2 text-white">Player Stats Archive</h1>
                <p className="text-gray-400">
                    Powered by PostGame Stats API. Look up detailed season statistics for NFL, NBA, and NCAAM players.
                </p>
            </div>

            <PlayerSearchClient />
        </div>
    );
}
