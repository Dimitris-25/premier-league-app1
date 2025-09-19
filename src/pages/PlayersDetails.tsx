// src/pages/PlayersDetails.tsx
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { service } from "../api/client";

/* --- Types --- */
type Profile = {
  player_id: number;
  name: string;
  nationality?: string;
  age?: number;
  photo?: string;
  team?: string;
  team_id?: number;
};

type SeasonStat = {
  player_id: number;

  // appearances/minutes
  appearances?: number;
  games_appearances?: number;
  games_appearences?: number;
  minutes?: number;
  games_minutes?: number;

  // position & rating
  games_position?: string;
  games_rating?: number | string;

  // scoring: possible schemes
  goals?: number;
  goals_total?: number;

  // assists:
  assists?: number;
  goals_assists?: number;
  assists_total?: number;

  // cards
  cards_yellow?: number;
  cards_red?: number;

  created_at?: string;
  updated_at?: string;
};

/* --- Helpers (strict, no-any) --- */
type Paged<T> = { data: T[] };
function isPaged<T>(v: unknown): v is Paged<T> {
  return typeof v === "object" && v !== null && Array.isArray((v as { data?: unknown }).data);
}
function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (isPaged<T>(res)) return res.data;
  return [];
}

const appsOf = (s: SeasonStat): number =>
  (s.appearances ?? s.games_appearances ?? s.games_appearences ?? 0);

const minutesOf = (s: SeasonStat): number =>
  (s.minutes ?? s.games_minutes ?? 0);

const ratingOf = (s: SeasonStat): number | undefined => {
  if (typeof s.games_rating === "number") return s.games_rating;
  if (typeof s.games_rating === "string") {
    const v = parseFloat(s.games_rating);
    return Number.isFinite(v) ? v : undefined;
  }
  return undefined;
};

const goalsOf = (s: SeasonStat): number =>
  (typeof s.goals === "number" ? s.goals : (s.goals_total ?? 0));

/** ✅ assists από assists | goals_assists | assists_total */
const assistsOf = (s: SeasonStat): number => {
  if (typeof s.assists === "number") return s.assists;
  if (typeof s.goals_assists === "number") return s.goals_assists;
  return s.assists_total ?? 0;
};

/** Aggregates ALL rows into ONE totals line */
function aggregate(stats: SeasonStat[]): SeasonStat | null {
  if (!stats.length) return null;

  let apps = 0, mins = 0, goals = 0, assists = 0, y = 0, r = 0;
  let wrSum = 0, w = 0; // weighted rating (by minutes)
  const posFreq = new Map<string, number>();

  for (const s of stats) {
    const a = appsOf(s);
    const m = minutesOf(s);
    const g = goalsOf(s);
    const a2 = assistsOf(s);
    const yy = s.cards_yellow ?? 0;
    const rr = s.cards_red ?? 0;

    apps += a;
    mins += m;
    goals += g;
    assists += a2;
    y += yy;
    r += rr;

    const rate = ratingOf(s);
    if (rate != null) {
      const weight = m > 0 ? m : 1;
      wrSum += rate * weight;
      w += weight;
    }

    const p = s.games_position?.trim();
    if (p) posFreq.set(p, (posFreq.get(p) ?? 0) + 1);
  }

  let bestPos: string | undefined;
  let bestCnt = -1;
  for (const [pos, cnt] of posFreq.entries()) {
    if (cnt > bestCnt) { bestCnt = cnt; bestPos = pos; }
  }

  const rating = w > 0 ? wrSum / w : undefined;

  return {
    player_id: stats[0].player_id,
    games_position: bestPos,
    games_rating: rating,
    appearances: apps,
    minutes: mins,
    goals,
    assists,
    cards_yellow: y,
    cards_red: r,
  };
}

/* --- Component --- */
export default function PlayersDetails() {
  const { id } = useParams();
  const playerId = Number(id);

  const [profile, setProfile] = useState<Profile | null>(null);
  const [row, setRow] = useState<SeasonStat | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!playerId || Number.isNaN(playerId)) {
      setError("Invalid player id.");
      return;
    }
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        const [pRes, sRes] = await Promise.all([
          service.find<Profile>("players-profiles"),
          service.find<SeasonStat>("players-season-stats", { player_id: playerId }),
        ]);

        if (!alive) return;

        // Φίλτρο ΜΟΝΟ στον παίκτη που ζητήθηκε
        const profiles = toArray<Profile>(pRes).filter(p => p.player_id === playerId);
        const statsAll = toArray<SeasonStat>(sRes).filter(s => s.player_id === playerId);

        setProfile(profiles[0] ?? null);
        setRow(aggregate(statsAll));
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [playerId]);

  const renderAppsCell = (apps?: number) => {
    if (apps == null) return "—";
    const dots = Math.min(10, apps);
    return (
      <div className="flex items-center gap-2">
        <span>{apps}</span>
        {dots > 0 && (
          <span className="text-xs opacity-60 tracking-[.25em] select-none">
            {"•".repeat(dots)}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="p-4 space-y-4">
      <div className="text-sm">
        <Link to="/players" className="underline">← Back to Players</Link>
      </div>

      <h1 className="text-3xl font-bold">Players</h1>
      <h2 className="text-lg font-semibold">Player #{playerId}</h2>

      {loading && <div className="text-sm">Loading…</div>}
      {error && <div className="text-sm text-red-600">Error: {error}</div>}

      {/* Profile */}
      <section className="rounded border p-4">
        <h3 className="font-semibold mb-2">Profile</h3>
        {profile ? (
          <div className="flex items-center gap-3">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt={profile.name}
                className="h-12 w-12 rounded-full object-cover"
              />
            ) : (
              <div className="h-12 w-12 rounded-full border" />
            )}
            <div className="min-w-0">
              <div className="font-medium">{profile.name}</div>
              <div className="text-xs opacity-70">
                {[profile.team, profile.nationality].filter(Boolean).join(" • ")}
                {profile.age ? ` • ${profile.age}y` : ""}
              </div>
            </div>
          </div>
        ) : (
          <div className="text-sm opacity-70">No profile found.</div>
        )}
      </section>

      {/* Totals (single row) */}
      <section className="rounded border p-4">
        <h3 className="font-semibold mb-2">Season Stats</h3>
        {row ? (
          <div className="overflow-auto">
            <table className="min-w-[820px] w-full text-sm">
              <thead className="bg-muted/30">
              <tr>
                <th className="text-left p-2">Pos</th>
                <th className="text-left p-2">Rating</th>
                <th className="text-left p-2">Apps</th>
                <th className="text-left p-2">Goals (total)</th>
                <th className="text-left p-2">Assists (total)</th>
                <th className="text-left p-2">Minutes</th>
                <th className="text-left p-2">Yellow</th>
                <th className="text-left p-2">Red</th>
              </tr>
              </thead>
              <tbody>
              <tr className="border-t">
                <td className="p-2">{row.games_position ?? "—"}</td>
                <td className="p-2">
                  {typeof row.games_rating === "number" ? row.games_rating.toFixed(2) : "—"}
                </td>
                <td className="p-2">{renderAppsCell(row.appearances)}</td>
                <td className="p-2">{row.goals ?? 0}</td>
                <td className="p-2">{row.assists ?? 0}</td>
                <td className="p-2">{row.minutes ?? "—"}</td>
                <td className="p-2">{row.cards_yellow ?? 0}</td>
                <td className="p-2">{row.cards_red ?? 0}</td>
              </tr>
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-sm opacity-70">No season stats.</div>
        )}
      </section>
    </div>
  );
}
