// src/pages/TeamDetails.tsx
import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { service, type QueryParams } from "../api/client";

/* ---------- Types ---------- */
type TeamInfoBase = {
  api_team_id: number;
  name: string;
  country?: string;
  founded?: number | null;
  venue?: string;
  logo?: string | null;
};
type TeamInfo = TeamInfoBase & ({ id: number } | { team_id: number });
const getTeamInfoId = (t: TeamInfo) => ("id" in t ? t.id : t.team_id);

type TeamStats = {
  stats_id: number;
  league_id: number;
  team_id: number;
  season: number;
  form: string | null;

  fixtures_played_home: number;
  fixtures_played_away: number;
  fixtures_played_total: number;

  wins_home: number;
  wins_away: number;
  wins_total: number;

  draws_home: number;
  draws_away: number;
  draws_total: number;

  loses_home: number;
  loses_away: number;
  loses_total: number;

  goals_for_home: number;
  goals_for_away: number;
  goals_for_total: number;

  goals_against_home: number;
  goals_against_away: number;
  goals_against_total: number;

  avg_goals_for_home: string;
  avg_goals_for_away: string;
  avg_goals_for_total: string;

  avg_goals_against_home: string;
  avg_goals_against_away: string;
  avg_goals_against_total: string;

  clean_sheet_home: number;
  clean_sheet_away: number;
  clean_sheet_total: number;

  failed_to_score_home: number;
  failed_to_score_away: number;
  failed_to_score_total: number;

  penalty_scored_total: number;
  penalty_scored_percentage: string;
  penalty_missed_total: number;
  penalty_missed_percentage: string;
  penalty_total: number;

  biggest_streak_wins: number;
  biggest_streak_draws: number;
  biggest_streak_loses: number;

  biggest_win_home: string | null;
  biggest_win_away: string | null;
  biggest_lose_home: string | null;
  biggest_lose_away: string | null;

  biggest_goals_for_home: number;
  biggest_goals_for_away: number;
  biggest_goals_against_home: number;
  biggest_goals_against_away: number;
};

/* ---------- Helpers ---------- */
const fmtDash = (v: unknown) => (v === null || v === undefined || v === "" ? "—" : String(v));
const fmtPct = (s: string) => `${Number.parseFloat(s).toFixed(0)}%`;

/* ---------- Component ---------- */
export default function TeamDetails() {
  const params = useParams<{ id: string }>();
  const routeId = Number(params.id);

  const [team, setTeam] = useState<TeamInfo | null>(null);
  const [stats, setStats] = useState<TeamStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let abort = false;

    const findOne = async (q: QueryParams) => {
      const r: TeamInfo[] | { data: TeamInfo[] } = await service.find<TeamInfo>("teamsInfo", {
        "$limit": 1,
        ...q,
      });
      const arr = Array.isArray(r) ? r : (r.data ?? []);
      return arr[0] ?? null;
    };

    const load = async () => {
      setLoading(true);
      setErr(null);
      try {
        const byTeamId = Number.isFinite(routeId) ? await findOne({ team_id: routeId }) : null;
        const resolvedTeam =
          byTeamId ??
          (Number.isFinite(routeId) ? await findOne({ id: routeId }) : null) ??
          (Number.isFinite(routeId) ? await findOne({ api_team_id: routeId }) : null);

        if (!resolvedTeam) throw new Error("Team not found.");
        if (abort) return;
        setTeam(resolvedTeam);
        // real time stats
        const teamIdForStats = "team_id" in resolvedTeam ? resolvedTeam.team_id : resolvedTeam.id;

        const sres: TeamStats[] | { data: TeamStats[] } = await service.find<TeamStats>(
          "teams-stats-files", // <-- προσαρμογή στη λογική του client/backend
          {
            "$limit": 1,
            "$sort[stats_id]": 1,
            team_id: teamIdForStats,
            season: 2025,
          } as QueryParams
        );

        const sarr = Array.isArray(sres) ? sres : (sres.data ?? []);
        const srow = sarr[0] ?? null;
        if (!srow) throw new Error("No stats found for 2025.");
        if (abort) return;
        setStats(srow);
      } catch (e) {
        if (!abort) setErr(e instanceof Error ? e.message : String(e));
      } finally {
        if (!abort) setLoading(false);
      }
    };

    void load();
    return () => {
      abort = true;
    };
  }, [routeId]);

  const gridRows = useMemo(
    () =>
      stats
        ? [
          { label: "Fixtures played", h: stats.fixtures_played_home, a: stats.fixtures_played_away, t: stats.fixtures_played_total },
          { label: "Wins",             h: stats.wins_home,             a: stats.wins_away,             t: stats.wins_total },
          { label: "Draws",            h: stats.draws_home,            a: stats.draws_away,            t: stats.draws_total },
          { label: "Losses",           h: stats.loses_home,            a: stats.loses_away,            t: stats.loses_total },
          { label: "Goals for",        h: stats.goals_for_home,        a: stats.goals_for_away,        t: stats.goals_for_total },
          { label: "Goals against",    h: stats.goals_against_home,    a: stats.goals_against_away,    t: stats.goals_against_total },
          { label: "Avg goals for",    h: stats.avg_goals_for_home,    a: stats.avg_goals_for_away,    t: stats.avg_goals_for_total },
          { label: "Avg goals against",h: stats.avg_goals_against_home,a: stats.avg_goals_against_away,t: stats.avg_goals_against_total },
          { label: "Clean sheets",     h: stats.clean_sheet_home,      a: stats.clean_sheet_away,      t: stats.clean_sheet_total },
          { label: "Failed to score",  h: stats.failed_to_score_home,  a: stats.failed_to_score_away,  t: stats.failed_to_score_total },
        ]
        : [],
    [stats]
  );

  if (loading) return <div className="p-4">Loading team…</div>;
  if (err) return <div className="p-4 text-red-600">Error: {err}</div>;
  if (!team || !stats) return null;

  const teamId = getTeamInfoId(team);

  return (
    <div className="p-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-4 rounded-lg border p-4">
        {team.logo ? (
          <img src={team.logo} alt={team.name} className="h-16 w-16 rounded bg-white object-contain" />
        ) : (
          <div className="h-16 w-16 rounded border bg-white" />
        )}
        <div className="min-w-0">
          <div className="text-xl font-semibold truncate">{team.name}</div>
          <div className="text-sm opacity-70 truncate">
            {[team.country, team.venue, team.founded ? `est. ${team.founded}` : ""].filter(Boolean).join(" • ")}
          </div>
          {stats.form ? (
            <div className="mt-1 text-sm">
              Form:{" "}
              <span className="inline-flex gap-1 align-middle">
                {stats.form.split("").map((ch, i) => (
                  <span
                    key={i}
                    className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                      ch === "W" ? "bg-green-100 text-green-700"
                        : ch === "D" ? "bg-gray-100 text-gray-700"
                          : ch === "L" ? "bg-red-100 text-red-700"
                            : "bg-slate-100 text-slate-700"
                    }`}
                  >
                    {ch}
                  </span>
                ))}
              </span>
            </div>
          ) : null}
        </div>
      </div>

      {/* Summary meta */}
      <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
        <span>Team ID: {teamId}</span>
        <span>API Team ID: {team.api_team_id}</span>
        <span>League ID: {stats.league_id}</span>
        <span>Season: {stats.season}</span>
      </div>

      {/* Main 3-column table */}
      <div className="overflow-x-auto rounded border">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left">Stat</th>
            <th className="px-3 py-2 text-center">Home</th>
            <th className="px-3 py-2 text-center">Away</th>
            <th className="px-3 py-2 text-center">Total</th>
          </tr>
          </thead>
          <tbody>
          {gridRows.map((r) => (
            <tr key={r.label} className="border-t">
              <td className="px-3 py-2">{r.label}</td>
              <td className="px-3 py-2 text-center">{fmtDash(r.h)}</td>
              <td className="px-3 py-2 text-center">{fmtDash(r.a)}</td>
              <td className="px-3 py-2 text-center">{fmtDash(r.t)}</td>
            </tr>
          ))}
          </tbody>
        </table>
      </div>

      {/* Penalties + Streaks + Biggest */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Penalties */}
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-2">Penalties</div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between"><span>Scored</span><span>{stats.penalty_scored_total} ({fmtPct(stats.penalty_scored_percentage)})</span></div>
            <div className="flex justify-between"><span>Missed</span><span>{stats.penalty_missed_total} ({fmtPct(stats.penalty_missed_percentage)})</span></div>
            <div className="flex justify-between"><span>Total</span><span>{stats.penalty_total}</span></div>
          </div>
        </div>

        {/* Streaks */}
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-2">Streaks</div>
          <div className="flex gap-2 text-sm">
            <span className="px-2 py-1 rounded bg-green-50 text-green-700">W: {stats.biggest_streak_wins}</span>
            <span className="px-2 py-1 rounded bg-gray-50 text-gray-700">D: {stats.biggest_streak_draws}</span>
            <span className="px-2 py-1 rounded bg-red-50 text-red-700">L: {stats.biggest_streak_loses}</span>
          </div>
        </div>

        {/* Biggest results */}
        <div className="rounded-lg border p-3">
          <div className="font-medium mb-2">Biggest Results</div>
          <div className="text-sm space-y-1">
            <div>Biggest win — Home: {fmtDash(stats.biggest_win_home)} | Away: {fmtDash(stats.biggest_win_away)}</div>
            <div>Biggest lose — Home: {fmtDash(stats.biggest_lose_home)} | Away: {fmtDash(stats.biggest_lose_away)}</div>
            <div className="mt-1 opacity-80">
              <div>Max goals for — Home: {stats.biggest_goals_for_home} | Away: {stats.biggest_goals_for_away}</div>
              <div>Max goals against — Home: {stats.biggest_goals_against_home} | Away: {stats.biggest_goals_against_away}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
