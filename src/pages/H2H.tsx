// src/pages/H2H.tsx
import { useEffect, useState } from "react";
import H2HTable from "../components/H2HTable";
import type { Match } from "../types/match";
import h2hData from "../../files/H2H.json";

/* ====== API-Football-ish types ====== */
type AFTeams = { home?: { name?: string }; away?: { name?: string } };
type AFGoals = { home?: number | null; away?: number | null };
type AFLeague = { name?: string };
type AFFixture = {
  fixture?: { id?: number; date?: string };
  league?: AFLeague;
  teams?: AFTeams;
  goals?: AFGoals;
};

const isObject = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isAFFixture = (v: unknown): v is AFFixture =>
  isObject(v) && ("fixture" in v || ("teams" in v && "goals" in v));

/* ====== Deep extract χωρίς any (πιάνει stringified JSON, envelopes κ.λπ.) ====== */
function deepExtractFixtures(raw: unknown): AFFixture[] {
  const out: AFFixture[] = [];
  const seen = new WeakSet<object>();

  const rec = (v: unknown): void => {
    if (v == null) return;

    if (typeof v === "string") {
      const t = v.trim();
      if (t.startsWith("{") || t.startsWith("[")) {
        try {
          rec(JSON.parse(t));
        } catch {
          // ignore bad JSON
        }
      }
      return;
    }

    if (Array.isArray(v)) {
      for (const item of v) rec(item);
      return;
    }

    if (typeof v === "object") {
      const obj = v as Record<string, unknown>;
      if (seen.has(obj)) return; // ✅ αποφυγή loop
      seen.add(obj);

      if (isAFFixture(obj)) {
        out.push(obj);
        return;
      }

      // γνωστά keys
      const candidates = ["response", "fixtures", "result", "data", "matches", "items", "events", "body"]
        .filter((k) => k in obj) as (keyof typeof obj)[];

      if (candidates.length > 0) {
        for (const k of candidates) rec(obj[k]);
        return; // ✅ σταμάτα εδώ
      }

      // αλλιώς κάνε scan όλα τα properties
      for (const val of Object.values(obj)) rec(val);
    }
  };

  rec(raw);
  return out;
}


/* ====== Mapping -> Match[] (strict) ====== */
function mapToMatches(fixtures: AFFixture[]): Match[] {
  return fixtures.map((x): Match => ({
    fixture_id:
      x.fixture?.id !== undefined ? Number(x.fixture.id) : Math.floor(Math.random() * 1e9),
    date: x.fixture?.date ?? "",
    league: { name: x.league?.name ?? "" },
    teams: {
      home: { name: x.teams?.home?.name ?? "" },
      away: { name: x.teams?.away?.name ?? "" },
    },
    goals: {
      home: Number(x.goals?.home ?? 0),
      away: Number(x.goals?.away ?? 0),
    },
  }));
}
function dedupeMatches(arr: Match[]): Match[] {
  const uniq = new Map<string, Match>();
  for (const m of arr) {
    const key = `${m.fixture_id}|${m.date}|${m.teams.home.name}|${m.teams.away.name}`;
    if (!uniq.has(key)) uniq.set(key, m);
  }
  return [...uniq.values()];
}


export default function H2H() {
  const [rows, setRows] = useState<Match[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const fixtures = deepExtractFixtures(h2hData as unknown);
      const matches = mapToMatches(fixtures);
      setRows(dedupeMatches(matches));

    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, []);

  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-4 space-y-2">
      <h2 className="text-xl font-semibold">Head-to-Head</h2>
      <H2HTable rows={rows} />
    </div>
  );
}
