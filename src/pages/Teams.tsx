// src/pages/Teams.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { service, type QueryParams } from "../api/client";

/* Allowed API-Football team ids (api_team_id) for 2025 */
const API_TEAM_IDS = [
  33, 34, 35, 36, 39, 40, 42, 44, 45, 47,
  48, 49, 50, 51, 52, 55, 63, 65, 66, 746,
] as const;
const API_TEAM_SET = new Set<number>(API_TEAM_IDS as unknown as number[]);

/* ---- Teams data types (UNCHANGED) ---- */
type TeamBase = {
  api_team_id: number;
  name: string;
  country?: string;
  founded?: number | null;
  venue?: string;
  logo?: string | null;
};
type Team = TeamBase & ({ id: number } | { team_id: number });
const getId = (t: Team) => ("id" in t ? t.id : t.team_id);
const isAllowedApiTeam = (t: Team) => API_TEAM_SET.has(t.api_team_id);

/* ---- Standings types (NO any) ---- */
type ApiStandingsTeam = { id: number; name: string; logo: string | null };
type ApiStandingsAll = {
  played: number;
  win: number;
  draw: number;
  lose: number;
  goals: { for: number; against: number };
};
type ApiStandingsEntry = {
  rank: number;
  team: ApiStandingsTeam;
  points: number;
  goalsDiff: number;
  form?: string | null;
  all: ApiStandingsAll;
};
type ApiStandingsResponse = {
  response: Array<{
    league: {
      standings: Array<ApiStandingsEntry[]>;
    };
  }>;
};

type StandRow = {
  rank: number;
  team_id: number;
  name: string;
  logo: string | null;
  played: number;
  win: number;
  draw: number;
  lose: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
  form: string;
};

export default function Teams() {
  // --- Teams state (UNCHANGED) ---
  const [rows, setRows] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const navigate = useNavigate();

  // --- Standings state ---
  const [standings, setStandings] = useState<StandRow[]>([]);
  const [stLoading, setStLoading] = useState(true);
  const [stError, setStError] = useState<string | null>(null);

  // ---- Load TEAMS (UNCHANGED) ----
  const fetchList = async (): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      const params: QueryParams = {
        "$limit": 100,
        "$sort[name]": 1,
        "api_team_id[$in]": [...API_TEAM_SET],
      };
      const res: Team[] | { data: Team[] } = await service.find<Team>("teamsInfo", params);
      let items: Team[] = Array.isArray(res) ? res : (res.data ?? []);
      if (items.length && items.some(t => !isAllowedApiTeam(t))) {
        items = items.filter(isAllowedApiTeam);
      }
      setRows(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void fetchList(); }, []);

  // ---- Load STANDINGS (REST, no widget) ----
  useEffect(() => {
    const controller = new AbortController();

    const API_KEY =
      (import.meta.env.VITE_APIFOOTBALL_KEY as string | undefined) ??
      (import.meta.env.VITE_API_KEY as string | undefined) ??
      "";

    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";

    const url = isLocal
      ? "/af/standings?league=39&season=2025"
      : `https://${(import.meta.env.VITE_AF_HOST as string) ?? "v3.football.api-sports.io"}/standings?league=39&season=2025`;

    (async () => {
      setStLoading(true);
      setStError(null);
      try {
        const init: RequestInit = { method: "GET", signal: controller.signal };
        if (!url.startsWith("/af")) {
          init.headers = { "x-apisports-key": API_KEY };
        }

        const res = await fetch(url, init);
        if (!res.ok) {
          const text = await res.text();
          throw new Error(`Standings HTTP ${res.status} — ${text.slice(0, 120)}`);
        }

        type ApiTeam = { id: number; name: string; logo: string | null };
        type ApiAll = { played: number; win: number; draw: number; lose: number; goals: { for: number; against: number } };
        type ApiEntry = { rank: number; team: ApiTeam; points: number; goalsDiff: number; form?: string | null; all: ApiAll };
        type ApiResp = { response: Array<{ league: { standings: Array<ApiEntry[]> } }> };

        const json = (await res.json()) as ApiResp;
        const table: ApiEntry[] = json.response?.[0]?.league?.standings?.[0] ?? [];

        const mapped: StandRow[] = table.map((s) => ({
          rank: s.rank,
          team_id: s.team.id,
          name: s.team.name,
          logo: s.team.logo,
          played: s.all.played,
          win: s.all.win,
          draw: s.all.draw,
          lose: s.all.lose,
          gf: s.all.goals.for,
          ga: s.all.goals.against,
          gd: s.goalsDiff,
          pts: s.points,
          form: s.form ?? "",
        }));

        setStandings(mapped);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setStError(err instanceof Error ? err.message : String(err));
      } finally {
        setStLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return rows;
    return rows.filter((t) =>
      [t.name, t.country ?? "", t.venue ?? "", t.founded ? String(t.founded) : ""]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [rows, q]);

  if (loading) return <div className="p-4">Loading teams…</div>;
  if (error) return <div className="p-4 text-red-600">Error: {error}</div>;

  return (
    <div className="p-2">
      {/* Controls */}
      <div className="mb-3 flex gap-2 items-center">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search team, country or venue…"
          className="h-9 w-64 rounded-md border px-2 text-sm outline-none"
        />
        <button className="h-9 px-3 rounded-md border text-sm" onClick={() => void fetchList()}>
          Refresh
        </button>
        <div className="text-sm opacity-70">Total: {filtered.length}</div>
      </div>

      {/* Logos grid (click → client-side nav) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
        {filtered.map((t) => {
          const id = getId(t);
          return (
            <button
              key={id}
              onClick={() => navigate(`/teams/${id}`)}
              className="group flex flex-col items-center gap-2 rounded-lg border p-3 hover:shadow-sm transition"
              title={t.name}
            >
              {t.logo ? (
                <img
                  src={t.logo}
                  alt={t.name}
                  loading="lazy"
                  className="h-14 w-14 rounded object-contain bg-white"
                />
              ) : (
                <div className="h-14 w-14 rounded border bg-white" />
              )}
              <div className="w-full text-center">
                <div className="font-medium text-sm truncate">{t.name}</div>
                <div className="text-[11px] opacity-70 truncate">
                  {[t.country, t.venue, t.founded ? `est. ${t.founded}` : ""]
                    .filter(Boolean)
                    .join(" • ")}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Standings (JSON → table) */}
      <div className="mt-6">
        <h3 className="text-lg font-semibold mb-2">Standings — Premier League 2025</h3>

        {stLoading && <div>Loading standings…</div>}
        {stError && <div className="text-red-600">Error: {stError}</div>}

        {!stLoading && !stError && (
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left">#</th>
                <th className="px-3 py-2 text-left">Team</th>
                <th className="px-3 py-2">P</th>
                <th className="px-3 py-2">W</th>
                <th className="px-3 py-2">D</th>
                <th className="px-3 py-2">L</th>
                <th className="px-3 py-2">GF</th>
                <th className="px-3 py-2">GA</th>
                <th className="px-3 py-2">GD</th>
                <th className="px-3 py-2">Pts</th>
                <th className="px-3 py-2">Form</th>
              </tr>
              </thead>
              <tbody>
              {standings.map((r) => (
                <tr key={r.team_id} className="border-t">
                  <td className="px-3 py-2">{r.rank}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {r.logo ? (
                        <img src={r.logo} alt="" className="h-5 w-5 object-contain" />
                      ) : null}
                      <span className="truncate">{r.name}</span>
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">{r.played}</td>
                  <td className="px-3 py-2 text-center">{r.win}</td>
                  <td className="px-3 py-2 text-center">{r.draw}</td>
                  <td className="px-3 py-2 text-center">{r.lose}</td>
                  <td className="px-3 py-2 text-center">{r.gf}</td>
                  <td className="px-3 py-2 text-center">{r.ga}</td>
                  <td className="px-3 py-2 text-center">{r.gd}</td>
                  <td className="px-3 py-2 text-center font-semibold">{r.pts}</td>
                  <td className="px-3 py-2 text-center">{r.form}</td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
