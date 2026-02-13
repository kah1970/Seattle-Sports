"use client";

import { useState } from "react";

const DATA_TYPES = [
  { value: "batting", label: "Batting Stats (FanGraphs/Statcast)" },
  { value: "pitching", label: "Pitching Stats (FanGraphs/Statcast)" },
  { value: "qb_metrics", label: "QB Metrics (PFR-style)" },
  { value: "team_efficiency", label: "Team Efficiency (DVOA-style)" },
  { value: "historic", label: "Historic Stats" },
];

const SPORTS = [
  { value: "MLB", label: "MLB" },
  { value: "NFL", label: "NFL" },
  { value: "NBA", label: "NBA" },
];

const TEAMS = [
  { value: "mariners", label: "Mariners" },
  { value: "seahawks", label: "Seahawks" },
  { value: "supersonics", label: "SuperSonics" },
];

export default function ImportPage() {
  const [sport, setSport] = useState("MLB");
  const [dataType, setDataType] = useState("batting");
  const [teamSlug, setTeamSlug] = useState("mariners");
  const [season, setSeason] = useState("2024");
  const [csvText, setCsvText] = useState("");
  const [result, setResult] = useState<{
    success?: boolean;
    error?: string;
    datasetId?: string;
    rowCount?: number;
  } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleImport() {
    if (!csvText.trim()) return;
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csvText, sport, dataType, teamSlug, season }),
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      setResult({
        error: err instanceof Error ? err.message : "Import failed",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
      setCsvText(ev.target?.result as string);
    };
    reader.readAsText(file);
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Data Import</h1>
      <p className="text-sm text-gray-400">
        Import CSV data from FanGraphs, Statcast, Pro Football Reference, or
        similar sources. Upload a CSV export and map it to our metrics format.
      </p>

      <div className="card space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Sport</label>
            <select
              value={sport}
              onChange={(e) => setSport(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-gray-300"
            >
              {SPORTS.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Team</label>
            <select
              value={teamSlug}
              onChange={(e) => setTeamSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-gray-300"
            >
              {TEAMS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">
              Data Type
            </label>
            <select
              value={dataType}
              onChange={(e) => setDataType(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-gray-300"
            >
              {DATA_TYPES.map((d) => (
                <option key={d.value} value={d.value}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Season</label>
            <input
              type="text"
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-gray-300"
              placeholder="2024"
            />
          </div>
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Upload CSV File
          </label>
          <input
            type="file"
            accept=".csv,.tsv,.txt"
            onChange={handleFileUpload}
            className="text-sm text-gray-400 file:mr-4 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-500/20 file:text-blue-400 hover:file:bg-blue-500/30"
          />
        </div>

        <div>
          <label className="text-xs text-gray-500 block mb-1">
            Or paste CSV data directly
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={10}
            placeholder="Name,AVG,OBP,SLG,HR,RBI,WAR&#10;Julio Rodriguez,.282,.338,.480,28,85,4.2"
            className="w-full px-3 py-2 rounded-lg bg-[var(--background)] border border-[var(--border)] text-gray-300 font-mono text-xs placeholder-gray-600"
          />
        </div>

        <button
          onClick={handleImport}
          disabled={loading || !csvText.trim()}
          className="px-4 py-2 rounded-md text-sm font-medium bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? "Importing..." : "Import Data"}
        </button>

        {result && (
          <div
            className={`p-3 rounded-lg text-sm ${
              result.success
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {result.success ? (
              <p>
                Imported {result.rowCount} rows. Dataset ID: {result.datasetId}
              </p>
            ) : (
              <p>Error: {result.error}</p>
            )}
          </div>
        )}
      </div>

      <div className="card">
        <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-2">
          Supported Formats
        </h2>
        <ul className="text-sm text-gray-400 space-y-1.5">
          <li>
            <strong className="text-gray-300">FanGraphs:</strong> Export from
            leaderboards as CSV. Supports batting and pitching stats.
          </li>
          <li>
            <strong className="text-gray-300">Statcast / Baseball Savant:</strong>{" "}
            Export search results as CSV for exit velocity, barrel rate, etc.
          </li>
          <li>
            <strong className="text-gray-300">Pro Football Reference:</strong>{" "}
            Copy table data and paste, or use &quot;Share &amp; Export &gt; Get as
            CSV&quot;.
          </li>
          <li>
            <strong className="text-gray-300">DVOA / EPA data:</strong> Use
            the team_efficiency type for Football Outsiders-style data.
          </li>
        </ul>
        <p className="text-xs text-gray-600 mt-3">
          Note: Do not scrape sites that disallow it. Use official CSV export
          features or licensed API data.
        </p>
      </div>
    </div>
  );
}
