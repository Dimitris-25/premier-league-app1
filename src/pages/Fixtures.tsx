import { useEffect, useMemo, useState } from "react";
import FixturesGrid from "../components/ui/FixturesGrid";

/* ---------- API types (όσα χρειαζόμαστε) ---------- */
type Team = { id: number; name: string; logo: string | null };
type Goals = { home: number | null; away: number | null };
type Status = { short: string; long: string; elapsed: number | null };
type FixtureInfo = {
  id: number;
  date: string;
  timestamp: number;
  status: Status;
  timezone: string;
  referee?: string | null;
  venue?: { name?: string | null; city?: string | null };
};
type ApiFixture = {
  fixture: FixtureInfo;
  league: { id: number; season: number; round?: string | null };
  teams: { home: Team; away: Team };
  goals: Goals;
};
type Paging = { current: number; total: number };
type ApiResp = { response: ApiFixture[]; paging?: Paging };

/* ---------- View model ---------- */
type Row = {
  id: number;
  whenLocal: string;
  home: { name: string; logo: string | null };
  away: { name: string; logo: string | null };
  statusShort: string;
  statusLong: string;
  score: string;
  venue: string;
  round?: string | null;
  referee?: string | null;
  elapsed?: number | null;
};

/* ---------- Groups ---------- */
const PLAYED = new Set(["FT", "AET", "PEN", "AWD", "WO", "CANC", "ABD"]);
const UPCOMING = new Set(["NS", "TBD", "PST"]);

/* ---------- Helpers ---------- */
const fmtLocal = (isoUtc: string) =>
  new Date(isoUtc).toLocaleString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });

const scoreString = (g: Goals, s: string) =>
  UPCOMING.has(s) ? "–" : `${g.home ?? 0}–${g.away ?? 0}`;

/* ===================================================================== */

export default function Fixtures() {
  const [mode, setMode] = useState<"upcoming" | "played">("played");
  const [allRows, setAllRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // σταθερές – Premier League, UK timezone
  const LEAGUE_ID = "39";
  const SEASON = String(import.meta.env.VITE_AF_SEASON || "2025"); // 2024/25
  const TZ = "Europe/London";
  const MAX_PAGES = Number(import.meta.env.VITE_AF_MAXPAGES || 4);

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    // ίδιο pattern με Standings: /af τοπικά, αλλιώς full host + header
    const isLocal =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const HOST = (import.meta.env.VITE_AF_HOST as string) || "v3.football.api-sports.io";
    const API_KEY =
      (import.meta.env.VITE_AF_KEY as string) ||
      (import.meta.env.VITE_API_FOOTBALL_KEY as string) ||
      "";

    (async () => {
      setLoading(true);
      setError(null);

      let page = 1;
      const acc: ApiFixture[] = [];

      try {
        while (true) {
          const qs = new URLSearchParams({
            league: LEAGUE_ID,
            season: SEASON,
            timezone: TZ,
            page: String(page),
          }).toString();

          const url = isLocal
            ? `/af/fixtures?${qs}`
            : `https://${HOST}/fixtures?${qs}`;

          const init: RequestInit = { method: "GET", signal: controller.signal };
          if (!url.startsWith("/af")) {
            init.headers = { "x-apisports-key": API_KEY, accept: "application/json" };
          }

          const r = await fetch(url, init);
          const text = await r.text();
          if (!r.ok) {
            const msg = `HTTP ${r.status} — ${text.slice(0, 180)}`;
            if (alive) setError(msg);
            break;
          }

          const json: ApiResp = JSON.parse(text);
          const chunk = json.response ?? [];
          acc.push(...chunk);

          const current = json.paging?.current ?? page;
          const total = json.paging?.total ?? page;
          if (chunk.length === 0 || current >= total || page >= MAX_PAGES) break;
          page = current + 1;
        }
      } catch (e) {
        if (alive) setError(e instanceof Error ? e.message : String(e ?? "Error"));
      }

      if (!alive) return;

      // Map → Row
      const mapped: Row[] = acc.map((it) => {
        const f = it.fixture;
        const s = f.status?.short ?? "NS";
        return {
          id: f.id,
          whenLocal: fmtLocal(f.date),
          home: { name: it.teams.home.name, logo: it.teams.home.logo },
          away: { name: it.teams.away.name, logo: it.teams.away.logo },
          statusShort: s,
          statusLong: f.status?.long ?? "",
          score: scoreString(it.goals, s),
          venue: [f.venue?.name, f.venue?.city].filter(Boolean).join(" — "),
          round: it.league.round ?? undefined,
          referee: f.referee ?? undefined,
          elapsed: f.status?.elapsed ?? undefined,
        };
      });

      // sort by timestamp asc
      mapped.sort((a, b) => {
        const ta =
          acc.find((x) => x.fixture.id === a.id)?.fixture?.timestamp ?? 0;
        const tb =
          acc.find((x) => x.fixture.id === b.id)?.fixture?.timestamp ?? 0;
        return ta - tb;
      });

      setAllRows(mapped);
      setLoading(false);
    })();

    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

  // φίλτρο toggle
  const rows = useMemo(() => {
    return mode === "upcoming"
      ? allRows.filter((r) => UPCOMING.has(r.statusShort))
      : allRows.filter((r) => PLAYED.has(r.statusShort) || (!UPCOMING.has(r.statusShort) && !PLAYED.has(r.statusShort)));
  }, [allRows, mode]);

  return (
    <div className="flex flex-col gap-6 p-4">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-xl font-semibold">Fixtures — Premier League 2025</h2>
        <div className="flex items-center gap-2">
          <div className="rounded border overflow-hidden">
            <button
              className={`px-3 h-9 text-sm ${mode === "upcoming" ? "bg-gray-100 font-medium" : ""}`}
              onClick={() => setMode("upcoming")}
            >
              Upcoming
            </button>
            <button
              className={`px-3 h-9 text-sm border-l ${mode === "played" ? "bg-gray-100 font-medium" : ""}`}
              onClick={() => setMode("played")}
            >
              Played
            </button>
          </div>
        </div>
      </div>

      {loading && <div>Loading fixtures…</div>}
      {error && <div className="text-red-600">Error: {error}</div>}
      {!loading && !error && rows.length === 0 && (
        <div className="p-3 text-sm opacity-70">No fixtures found.</div>
      )}
      {!loading && !error && rows.length > 0 ? (
        <FixturesGrid rows={rows} loading={loading} />
      ) : null}
    </div>
  );
}
