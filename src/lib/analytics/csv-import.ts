import { prisma } from "@/lib/db";
import { CSVImportConfig } from "@/lib/types";

/**
 * Parse CSV text into rows of key-value pairs.
 * Handles quoted fields and common CSV edge cases.
 */
export function parseCSV(
  csvText: string
): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvText.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { headers: [], rows: [] };

  const headers = parseCSVLine(lines[0]);
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const row: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = values[j] || "";
    }
    rows.push(row);
  }

  return { headers, rows };
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Import a CSV dataset into the database as metrics.
 */
export async function importCSVDataset(
  csvText: string,
  config: CSVImportConfig
): Promise<{ datasetId: string; rowCount: number }> {
  const { rows } = parseCSV(csvText);

  // Find the team
  const team = await prisma.team.findUnique({
    where: { slug: config.teamSlug },
  });
  if (!team) throw new Error(`Team not found: ${config.teamSlug}`);

  // Create the dataset record
  const dataset = await prisma.importedDataset.create({
    data: {
      name: `${config.dataType} - ${config.season || "latest"}`,
      sport: config.sport,
      dataType: config.dataType,
      season: config.season,
      fileName: `import-${Date.now()}.csv`,
      rowCount: rows.length,
      columnMap: JSON.stringify(config.columnMapping),
    },
  });

  // Map columns and create metrics
  const playerCol = config.columnMapping["player"] || "Name";
  const metricsToCreate: Array<{
    name: string;
    value: number;
    stringValue: string | null;
    category: string;
    season: string | null;
    playerName: string | null;
    teamId: string;
    datasetId: string;
  }> = [];

  for (const row of rows) {
    const playerName = row[playerCol] || null;

    for (const [csvCol, metricName] of Object.entries(
      config.columnMapping
    )) {
      if (csvCol === "player") continue;
      const rawValue = row[csvCol];
      if (rawValue === undefined || rawValue === "") continue;

      const numValue = parseFloat(rawValue);
      metricsToCreate.push({
        name: metricName,
        value: isNaN(numValue) ? 0 : numValue,
        stringValue: isNaN(numValue) ? rawValue : null,
        category: config.dataType,
        season: config.season || null,
        playerName,
        teamId: team.id,
        datasetId: dataset.id,
      });
    }
  }

  // Batch insert
  if (metricsToCreate.length > 0) {
    const BATCH_SIZE = 100;
    for (let i = 0; i < metricsToCreate.length; i += BATCH_SIZE) {
      const batch = metricsToCreate.slice(i, i + BATCH_SIZE);
      await prisma.metric.createMany({ data: batch });
    }
  }

  return { datasetId: dataset.id, rowCount: rows.length };
}

/**
 * Get common column mapping presets for known data types.
 */
export function getColumnPresets(
  dataType: string
): Record<string, string> {
  switch (dataType) {
    case "batting":
      return {
        player: "Name",
        AVG: "avg",
        OBP: "obp",
        SLG: "slg",
        "OPS+": "ops_plus",
        "wRC+": "wrc_plus",
        WAR: "war",
        HR: "home_runs",
        RBI: "rbi",
        "BB%": "walk_rate",
        "K%": "strikeout_rate",
      };
    case "pitching":
      return {
        player: "Name",
        ERA: "era",
        FIP: "fip",
        WHIP: "whip",
        "K/9": "k_per_9",
        "BB/9": "bb_per_9",
        WAR: "war",
        IP: "innings_pitched",
        "ERA+": "era_plus",
      };
    case "qb_metrics":
      return {
        player: "Player",
        "Pass Yds": "pass_yards",
        "Pass TD": "pass_td",
        INT: "interceptions",
        "Cmp%": "completion_pct",
        "Y/A": "yards_per_attempt",
        QBR: "qbr",
        EPA: "epa",
        CPOE: "cpoe",
      };
    case "team_efficiency":
      return {
        player: "Team",
        DVOA: "dvoa",
        "Off DVOA": "off_dvoa",
        "Def DVOA": "def_dvoa",
        "ST DVOA": "st_dvoa",
        "Win%": "win_pct",
      };
    default:
      return {};
  }
}
