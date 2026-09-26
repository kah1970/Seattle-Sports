import { NextResponse } from "next/server";

const MLB_API = "https://statsapi.mlb.com/api/v1";

let cachedToken: string | null = null;
let tokenExpiresAt = 0;

/** Retrieves a valid JWT from the local Flask API */
async function getAuthToken() {
  const now = Date.now();
  // Buffer of 5 minutes before expiration
  if (cachedToken && now < tokenExpiresAt - 5 * 60 * 1000) {
    return cachedToken;
  }

  const credentials = { username: "seattlesports", password: "ssipassword123" };

  try {
    // Attempt to register first (fails silently if already exists)
    await fetch("http://127.0.0.1:5000/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    // Now login
    const res = await fetch("http://127.0.0.1:5000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });

    if (!res.ok) throw new Error("Failed to authenticate with PostGame API");

    const data = await res.json();
    cachedToken = data.token;
    // Token expires in 24 hours according to Flask auth.py
    tokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    return cachedToken;
  } catch (err) {
    console.error("Auth error:", err);
    throw err;
  }
}

export async function POST(request: Request) {
  try {
    const { league, endpoint, payload } = await request.json();

    if (!league || !endpoint || !payload) {
      return NextResponse.json(
        { error: "Missing required fields: league, endpoint, payload" },
        { status: 400 }
      );
    }

    // ── MLB: direct to MLB Stats API (no Flask proxy needed) ──────────────
    if (league === "mlb") {
      return handleMLB(endpoint, payload);
    }

    let token;
    try {
      token = await getAuthToken();
    } catch (authErr) {
      return NextResponse.json(
        { error: `Auth failed: ${authErr instanceof Error ? authErr.message : String(authErr)}` },
        { status: 500 }
      );
    }

    // Proxy the request to the local Flask API
    const res = await fetch(`http://127.0.0.1:5000/api/${league}/player/${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
      body: JSON.stringify(payload),
      // Set a timeout so the Next.js app doesn't hang forever, but give Flask time
      signal: AbortSignal.timeout(30000),
    });

    if (!res.ok) {
      if (res.status === 401) {
        cachedToken = null;
      }
      return NextResponse.json(
        { error: `PostGame API returned ${res.status} ${res.statusText}` },
        { status: res.status }
      );
    }

    // The hexmap endpoint returns a raw string message, not JSON
    // e.g "Regular Season Hex Map created for LeBron James for season: 2023-24"
    if (endpoint === "hexmap") {
      const text = await res.text();
      // The image is saved locally by the Python server as:
      // {playerName}_{season}_{seasonType}_hexmap_chart.png
      // where spaces in playername and dots are untouched in the filename logic
      const { playerName, season, seasonType } = payload;
      const filename = `${playerName}_${season}_${seasonType}_hexmap_chart.png`;
      const imageUrl = `http://127.0.0.1:5000/shotcharts/${encodeURIComponent(filename)}`;
      return NextResponse.json({ message: text, imageUrl });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Player Stats Proxy Error:", error);

    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json(
        { error: "Request to PostGame Stats API timed out. Is the Flask server running?" },
        { status: 504 }
      );
    }

    return NextResponse.json(
      { error: "Failed to connect to local PostGame Stats API. Ensure the Flask server is running on port 5000." },
      { status: 500 }
    );
  }
}

// ── MLB Stats API handler ─────────────────────────────────────────────────

async function handleMLB(endpoint: string, payload: { playerName?: string; season?: string }) {
  const { playerName, season } = payload;

  if (!playerName) {
    return NextResponse.json({ error: "playerName is required" }, { status: 400 });
  }

  const mlbSeason = season || String(new Date().getFullYear());

  try {
    // Step 1: Search for the player by name
    const searchRes = await fetch(
      `${MLB_API}/people/search?names=${encodeURIComponent(playerName)}&sportIds=1`,
      { next: { revalidate: 3600 } }
    );
    if (!searchRes.ok) {
      return NextResponse.json({ error: `MLB player search failed: ${searchRes.status}` }, { status: 502 });
    }

    const searchData = await searchRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const people = searchData.people || [];
    if (people.length === 0) {
      return NextResponse.json({ error: `Player "${playerName}" not found in MLB` }, { status: 404 });
    }

    // Try to find an active player, fallback to first result
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = people.find((p: any) => p.active) || people[0];
    const playerId = player.id;
    const fullName = player.fullName;
    const position = player.primaryPosition?.abbreviation ?? "";
    const team = player.currentTeam?.name ?? "Free Agent";

    if (endpoint === "search") {
      // Return search results only
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return NextResponse.json(people.slice(0, 10).map((p: any) => ({
        id: p.id,
        name: p.fullName,
        position: p.primaryPosition?.abbreviation,
        team: p.currentTeam?.name ?? "Free Agent",
        active: p.active,
      })));
    }

    // Step 2: Determine if hitter or pitcher for the game log
    const isPitcher = ["P", "SP", "RP", "CL"].includes(position);
    const group = isPitcher ? "pitching" : "hitting";

    // Step 3: Fetch game log
    const logRes = await fetch(
      `${MLB_API}/people/${playerId}/stats?stats=gameLog&season=${mlbSeason}&group=${group}&gameType=R`,
      { next: { revalidate: 300 } }
    );
    if (!logRes.ok) {
      return NextResponse.json({ error: `MLB game log API failed: ${logRes.status}` }, { status: 502 });
    }

    const logData = await logRes.json();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const splits = logData.stats?.[0]?.splits || [];

    // Step 4: Also fetch season totals
    const totalsRes = await fetch(
      `${MLB_API}/people/${playerId}/stats?stats=season&season=${mlbSeason}&group=${group}&gameType=R`,
      { next: { revalidate: 300 } }
    );
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let seasonTotals: any = null;
    if (totalsRes.ok) {
      const totalsData = await totalsRes.json();
      seasonTotals = totalsData.stats?.[0]?.splits?.[0]?.stat ?? null;
    }

    // Step 5: Format game log entries
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const gameLog = splits.map((s: any) => {
      const stat = s.stat || {};
      const opponent = s.opponent?.name ?? "Unknown";
      const isHome = s.isHome;
      const date = s.date;
      const gamePk = s.game?.gamePk;

      if (isPitcher) {
        return {
          _source: "mlb",
          _type: "pitching",
          GAME_DATE: date,
          MATCHUP: isHome ? `vs ${opponent}` : `@ ${opponent}`,
          Game_ID: gamePk ? String(gamePk) : undefined,
          IP: stat.inningsPitched ?? "-",
          H: stat.hits ?? 0,
          R: stat.runs ?? 0,
          ER: stat.earnedRuns ?? 0,
          BB: stat.baseOnBalls ?? 0,
          SO: stat.strikeOuts ?? 0,
          HR: stat.homeRuns ?? 0,
          ERA: stat.era ?? "-",
          PITCHES: stat.numberOfPitches ?? "-",
          DECISION: stat.summary ?? "-",
        };
      }

      return {
        _source: "mlb",
        _type: "hitting",
        GAME_DATE: date,
        MATCHUP: isHome ? `vs ${opponent}` : `@ ${opponent}`,
        Game_ID: gamePk ? String(gamePk) : undefined,
        AB: stat.atBats ?? 0,
        H: stat.hits ?? 0,
        HR: stat.homeRuns ?? 0,
        RBI: stat.rbi ?? 0,
        BB: stat.baseOnBalls ?? 0,
        SO: stat.strikeOuts ?? 0,
        SB: stat.stolenBases ?? 0,
        AVG: stat.avg ?? "-",
        OPS: stat.ops ?? "-",
        R: stat.runs ?? 0,
      };
    });

    return NextResponse.json({
      player: { id: playerId, name: fullName, position, team, isPitcher },
      season: mlbSeason,
      seasonTotals,
      data: gameLog.reverse(),
    });
  } catch (error) {
    console.error("MLB Stats API error:", error);
    return NextResponse.json(
      { error: `MLB Stats API error: ${error instanceof Error ? error.message : "Unknown"}` },
      { status: 500 }
    );
  }
}
