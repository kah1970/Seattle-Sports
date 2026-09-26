# Seattle Sports Intel

Aggregated news, scores, analysis, highlights, and advanced stats for Seattle's sports teams:
- **MLB**: Seattle Mariners
- **NFL**: Seattle Seahawks
- **NBA (Legacy)**: Seattle SuperSonics — historic content, alumni, retrospectives, and expansion updates (reported facts only)

## Tech Stack

- **Framework**: Next.js 14 (App Router) + TypeScript
- **Styling**: Tailwind CSS
- **Database**: SQLite via Prisma
- **Charts**: Recharts + custom SVG sparklines
- **Testing**: Vitest (unit) + Playwright (e2e)
- **Deployment**: Vercel-ready

## Quick Start

```bash
# Install dependencies
npm install

# Set up database and seed with sample data
npx prisma db push
npm run db:seed

# Start development server
npm run dev
```

Visit `http://localhost:3000`.

## Environment Variables

Create a `.env` file:

```env
DATABASE_URL="file:./dev.db"
# CRON_SECRET="your-secret-here"     # Auth for cron endpoint
# REDIS_URL=""                        # Optional Redis caching
# LLM_API_KEY=""                      # Optional LLM summaries
# LIVE_SCORES_ENABLED="false"         # Enable live score polling
```

## Project Structure

```
src/
├── app/                    # Next.js routes
│   ├── page.tsx            # Home dashboard
│   ├── dashboard-client.tsx
│   ├── team/[slug]/        # Team pages (mariners, seahawks, supersonics)
│   ├── article/[id]/       # Article deep-dive view
│   ├── search/             # Search + filters
│   ├── bookmarks/          # User bookmarks
│   ├── digest/             # Daily digest
│   ├── admin/              # Source health + data import
│   └── api/
│       ├── articles/       # Article CRUD + search
│       ├── bookmarks/      # Bookmark toggle
│       ├── scores/         # Game schedule/scores
│       ├── metrics/        # Player/team metrics
│       ├── nuggets/        # Stat nuggets
│       ├── digest/         # Digest generation
│       ├── import/         # CSV data import
│       ├── admin/sources/  # Source health data
│       └── cron/refresh/   # Background data refresh
├── components/             # Shared UI components
├── lib/
│   ├── config.ts           # Teams, sources, ranking weights
│   ├── types.ts            # TypeScript interfaces
│   ├── db.ts               # Prisma client singleton
│   ├── ranking.ts          # Scoring, dedup, analysis depth
│   ├── ingestion.ts        # Main ingestion pipeline
│   ├── sources/            # Source adapters
│   │   ├── index.ts        # Adapter registry
│   │   ├── rss-adapter.ts  # RSS feed adapter
│   │   ├── mlb-scores-adapter.ts  # MLB Stats API
│   │   └── nfl-scores-adapter.ts  # NFL (mock, needs licensed API)
│   └── analytics/
│       ├── stat-nuggets.ts # Daily stat facts
│       └── csv-import.ts   # CSV data import + parsing
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts             # Seed script
└── e2e/                    # Playwright tests
```

## Adding a New Source Adapter

1. Create a file in `src/lib/sources/` implementing the `SourceAdapter` interface:

```typescript
import { SourceAdapter, ArticleItem } from "@/lib/types";

export function createMyAdapter(): SourceAdapter {
  return {
    name: "My Source",
    type: "api",
    async fetch(): Promise<ArticleItem[]> {
      // Fetch and return articles
      return [];
    },
    async healthCheck() {
      return { ok: true, message: "Working" };
    },
  };
}
```

2. Register it in `src/lib/sources/index.ts`:

```typescript
import { createMyAdapter } from "./my-adapter";
// Add to news or scores array in createAdapterRegistry()
```

3. Run `/api/cron/refresh` to test ingestion.

## Importing Analytics CSVs

1. Go to `/admin/import`
2. Select sport, team, data type, and season
3. Upload a CSV or paste data directly
4. The system maps columns to metrics using presets for:
   - **FanGraphs** batting/pitching exports
   - **Statcast / Baseball Savant** exports
   - **Pro Football Reference** table exports
   - **DVOA/EPA** team efficiency data

Column mapping presets are in `src/lib/analytics/csv-import.ts` (`getColumnPresets`).

## Running the Cron Refresh

```bash
# Locally
curl http://localhost:3000/api/cron/refresh

# With auth (production)
curl "https://your-app.vercel.app/api/cron/refresh?secret=YOUR_CRON_SECRET"
```

On Vercel, the cron is configured in `vercel.json` to run every 2 hours.

## Season Pulse & Go Deeper

The Mariners page header and **Season Pulse** panel come live from the public MLB Stats API (cached 15 min): record, division place, wild-card games back, win pace, run differential vs. expected record, and MLB ranks for runs, OPS, home runs, ERA and WHIP. The Mariners "Stat of the Day" is generated from the same data. If the API is unreachable the page falls back to the values in `TEAMS` in `src/lib/config.ts`.

Every team page has a **Go Deeper** panel of research links, configured in `RESEARCH_LINKS` in `src/lib/config.ts`. Set `MLB_STATS_API_BASE` to point Season Pulse at a local mock.

## Championship Banner Photos

The Seahawks page shows a Super Bowl LX banner with built-in trophy and ring artwork. To use real photos, save them as `public/champions/trophy.jpg` and `public/champions/ring.jpg` (`.png` or `.webp` also work); the page picks them up automatically. Use photos you have the rights to if this repo is public.

## Sample Data

`npm run db:seed` sets up teams and sources only, and removes any sample articles, games and stats left from earlier seeds (they're made up and would pose as real news). For demos or the Playwright tests, use `npm run db:seed:samples` instead.

## Cleaning Up Off-Topic Articles

Articles are assigned to a team only if they mention it (whole-word match on `TEAM_KEYWORDS`). To remove articles stored before that rule existed:

```bash
npm run db:prune            # dry run: lists what would be removed
npm run db:prune -- --apply # delete them (bookmarked or rated articles are kept)
```

## Ranking Algorithm

Articles are scored based on:
- **Recency** (35%): Exponential decay over time
- **Publisher Reputation** (25%): Configurable per source in `config.ts`
- **Analysis Depth** (25%): Heuristic based on word count, analytics keywords, data density
- **Engagement** (15%): Log-scale of clicks + bookmarks

The UI provides a slider ("More breaking" vs "More analysis") that adjusts recency vs. depth weights in real-time.

## Testing

```bash
# Unit tests
npm test

# E2E tests (starts dev server automatically)
npm run db:seed:samples   # e2e tests need the sample articles
npm run test:e2e
```

## Key Design Decisions

- **No scraping**: RSS feeds and official APIs only. Pro Football Reference and similar sites are accessed via CSV export/import.
- **Pluggable adapters**: Each data source is isolated behind a `SourceAdapter` interface.
- **SuperSonics coverage**: Historic/retrospective content only. Expansion news is reported factually with explicit disclaimers.
- **Dark mode default**: Sports analytics aesthetic with team-specific color accents.
- **SQLite for simplicity**: No external database service needed. Swap to PostgreSQL via Prisma for production scale.

## Database Schema

Core models: `Team`, `Source`, `Article`, `Tag`, `Bookmark`, `DigestSnapshot`, `ImportedDataset`, `Metric`, `GameSchedule`, `StatNugget`

See `prisma/schema.prisma` for full schema.

## License

MIT
