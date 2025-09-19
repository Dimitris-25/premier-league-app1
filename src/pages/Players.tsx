// src/pages/Players.tsx
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { service } from "../api/client";

/* ---------------- Types (safe/minimal) ---------------- */
type TeamInfo = {
  team_id: number;
  name: string;
  logo?: string;
};

type Profile = {
  player_id: number;
  name: string;
  nationality?: string;
  age?: number;
  photo?: string;
  team_id?: number;
};

type SeasonStat = {
  player_id: number;
  team_id?: number;
  games_rating?: number | string;
  season_id?: number | string;
};

type TopStat = {
  topstat_id: number;
  player_id: number;
  team_id?: number;
  league_id?: number;
  season_id?: number;
  goals_total?: number;
  assists_total?: number;
  yellow_cards?: number;
  red_cards?: number;
};

/* -------------- Helpers (strict, no-any) -------------- */
type Paged<T> = { data: T[] };

function isPaged<T>(v: unknown): v is Paged<T> {
  return typeof v === "object" && v !== null && Array.isArray((v as { data?: unknown }).data);
}

function toArray<T>(res: unknown): T[] {
  if (Array.isArray(res)) return res as T[];
  if (isPaged<T>(res)) return res.data;
  return [];
}

function toNumber(v: number | string | undefined): number | undefined {
  if (v == null) return undefined;
  const n = typeof v === "string" ? parseFloat(v) : v;
  return Number.isFinite(n) ? n : undefined;
}

/* -------------- Constants -------------- */
const TARGET_SEASON_ID = 18;

/* -------------- UI Row types -------------- */
type UiRow = {
  player_id: number;
  name: string;
  team?: string;
  photo?: string;
  value: number;           // metric value to show
  topstat_id?: number;     // only for categories from top-stats
};

export default function Players() {
  const nav = useNavigate();

  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [teams, setTeams] = useState<Map<number, TeamInfo>>(new Map());
  const [ratingByPlayer, setRatingByPlayer] = useState<Map<number, number>>(new Map());

  const [goals, setGoals] = useState<UiRow[]>([]);
  const [assists, setAssists] = useState<UiRow[]>([]);
  const [yellows, setYellows] = useState<UiRow[]>([]);
  const [reds, setReds] = useState<UiRow[]>([]);

  const [q, setQ] = useState(""); // quick search -> go to details
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setError(null);

        // Pull minimal datasets
        const [profilesRes, seasonRes, topRes, teamsRes] = await Promise.all([
          service.find<Profile>("players-profiles"),
          service.find<SeasonStat>("players-season-stats", { season_id: TARGET_SEASON_ID }),
          service.find<TopStat>("players-top-stats", { season_id: TARGET_SEASON_ID }),
          service.find<TeamInfo>("teamsInfo"),
        ]);

        if (!alive) return;

        const prof = toArray<Profile>(profilesRes);
        const season = toArray<SeasonStat>(seasonRes);
        const top = toArray<TopStat>(topRes);
        const teamsArr = toArray<TeamInfo>(teamsRes);

        // Maps
        const teamsMap = new Map<number, TeamInfo>();
        teamsArr.forEach(t => teamsMap.set(t.team_id, t));

        // Ratings: average per player for this season
        const rSum = new Map<number, { sum: number; cnt: number }>();
        season.forEach(s => {
          const pid = s.player_id;
          const r = toNumber(s.games_rating);
          if (r != null) {
            const cur = rSum.get(pid) ?? { sum: 0, cnt: 0 };
            rSum.set(pid, { sum: cur.sum + r, cnt: cur.cnt + 1 });
          }
        });
        const rMap = new Map<number, number>();
        rSum.forEach((v, pid) => rMap.set(pid, v.sum / Math.max(1, v.cnt)));

        // Helper to construct UiRow from TopStat category
        const mkRows = (picker: (t: TopStat) => number | undefined): UiRow[] => {
          const rows: UiRow[] = [];
          for (const t of top) {
            const val = picker(t);
            if (val == null) continue;
            const p = prof.find(x => x.player_id === t.player_id);
            if (!p) continue;

            // Prefer team from top-stats -> season -> profile
            const teamId = t.team_id ?? season.find(s => s.player_id === t.player_id)?.team_id ?? p.team_id;
            const teamName = teamId != null ? teamsMap.get(teamId)?.name : undefined;

            rows.push({
              player_id: p.player_id,
              name: p.name,
              team: teamName,
              photo: p.photo,
              value: val,
              topstat_id: t.topstat_id,
            });
          }
          // sort desc and top 5
          rows.sort((a, b) => b.value - a.value);
          return rows.slice(0, 5);
        };

        const topGoals = mkRows(t => toNumber(t.goals_total));
        const topAssists = mkRows(t => toNumber(t.assists_total));
        const topYellows = mkRows(t => toNumber(t.yellow_cards));
        const topReds = mkRows(t => toNumber(t.red_cards));

        if (alive) {
          setProfiles(prof);
          setTeams(teamsMap);
          setRatingByPlayer(rMap);
          setGoals(topGoals);
          setAssists(topAssists);
          setYellows(topYellows);
          setReds(topReds);
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const topRatings = useMemo<UiRow[]>(() => {
    // Build from ratingByPlayer + profiles
    const rows: UiRow[] = profiles
      .map(p => {
        const r = ratingByPlayer.get(p.player_id);
        if (r == null) return null;
        const teamId = p.team_id;
        const teamName = teamId != null ? teams.get(teamId)?.name : undefined;
        return {
          player_id: p.player_id,
          name: p.name,
          team: teamName,
          photo: p.photo,
          value: r,
        } as UiRow;
      })
      .filter((x): x is UiRow => x !== null);

    rows.sort((a, b) => b.value - a.value);
    return rows.slice(0, 5);
  }, [profiles, ratingByPlayer, teams]);

  const onSearchGo = () => {
    const s = q.trim().toLowerCase();
    if (!s) return;
    // Try exact by name; else first contains
    const exact = profiles.find(p => p.name.toLowerCase() === s);
    const first = exact ?? profiles.find(p => p.name.toLowerCase().includes(s));
    if (first) nav(`/players/${first.player_id}`);
  };

  if (loading) return <div className="p-4 text-sm">Loading top players…</div>;
  if (error)   return <div className="p-4 text-sm text-red-600">Error: {error}</div>;

  const Section = ({ title, rows, showId }: { title: string; rows: UiRow[]; showId?: boolean }) => (
    <section className="rounded border p-3">
      <h3 className="font-semibold mb-2">{title}</h3>
      {rows.length ? (
        <div className="overflow-auto">
          <table className="min-w-[520px] w-full text-sm">
            <thead className="bg-muted/30">
            <tr>
              <th className="text-left p-2 w-10">#</th>
              <th className="text-left p-2">Player</th>
              <th className="text-left p-2">Team</th>
              <th className="text-right p-2">Value</th>
              {showId && <th className="text-left p-2">topstat_id</th>}
            </tr>
            </thead>
            <tbody>
            {rows.map((r, i) => (
              <tr key={r.player_id} className="border-t">
                <td className="p-2">{i + 1}</td>
                <td className="p-2">
                  <Link to={`/players/${r.player_id}`} className="inline-flex items-center gap-2 hover:underline">
                    {r.photo ? (
                      <img src={r.photo} alt={r.name} className="h-7 w-7 rounded-full object-cover" />
                    ) : (
                      <span className="h-7 w-7 rounded-full inline-block border" />
                    )}
                    <span className="truncate">{r.name}</span>
                  </Link>
                </td>
                <td className="p-2">{r.team ?? "—"}</td>
                <td className="p-2 text-right">{r.value.toFixed(2).replace(/\.00$/, "")}</td>
                {showId && <td className="p-2">{r.topstat_id ?? "—"}</td>}
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-sm opacity-70">No data.</div>
      )}
    </section>
  );

  return (
    <div className="p-3 space-y-4">
      {/* Quick search to jump to player details */}
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter") onSearchGo(); }}
          placeholder="Search player and press Enter…"
          className="h-9 w-80 rounded-md border px-2 text-sm outline-none"
        />
        <button
          onClick={onSearchGo}
          className="h-9 px-3 rounded-md border text-sm hover:bg-muted/40"
        >
          Go
        </button>
      </div>

      {/* Top tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <Section title="Top Goals" rows={goals} showId />
        <Section title="Top Assists" rows={assists} showId />
        <Section title="Most Yellow Cards" rows={yellows} showId />
        <Section title="Most Red Cards" rows={reds} showId />
        <Section title="Top Ratings" rows={topRatings} />
      </div>
    </div>
  );
}
