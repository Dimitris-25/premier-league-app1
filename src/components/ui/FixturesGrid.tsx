import * as React from "react";
import {
  DataGrid,
  GridColDef,
  GridRenderCellParams,
  GridValidRowModel,
} from "@mui/x-data-grid";

/* ---- Input row από Fixtures.tsx ---- */
export type FixturesRow = {
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

/* ---- FlatRow για το DataGrid (primitives) ---- */
type FlatRow = GridValidRowModel & {
  id: number;
  whenLocal: string;
  homeName: string;
  homeLogo: string | null;
  awayName: string;
  awayLogo: string | null;
  statusShort: string;
  statusLong: string;
  score: string;
  venue: string;
  round: string | null;
  referee: string | null;
  elapsed: number | null;
};

const LIVE = new Set(["1H","HT","2H","ET","BT","P","SUSP","INT","LIVE"]);
const PLAYED = new Set(["FT","AET","PEN","AWD","WO","CANC","ABD"]);

const Badge: React.FC<{ code: string; title?: string }> = ({ code, title }) => {
  const cls = LIVE.has(code)
    ? "bg-yellow-100 border-yellow-300"
    : PLAYED.has(code)
      ? "bg-green-100 border-green-300"
      : "bg-gray-100 border-gray-300";
  return (
    <span className={`inline-block rounded border px-2 py-0.5 text-[11px] ${cls}`} title={title}>
      {code}
    </span>
  );
};

export default function FixturesGrid({
                                       rows,
                                       loading,
                                       pageSize = 20,
                                       height = 520,
                                     }: {
  rows: FixturesRow[];
  loading?: boolean;
  pageSize?: number;
  height?: number | string;
}) {
  // flatten με αυστηρούς τύπους
  const flatRows: FlatRow[] = React.useMemo(
    () =>
      rows.map((r) => ({
        id: r.id,
        whenLocal: r.whenLocal,
        homeName: r.home.name,
        homeLogo: r.home.logo,
        awayName: r.away.name,
        awayLogo: r.away.logo,
        statusShort: r.statusShort,
        statusLong: r.statusLong,
        score: r.score,
        venue: r.venue,
        round: r.round ?? null,
        referee: r.referee ?? null,
        elapsed: r.elapsed ?? null,
      })),
    [rows]
  );

  const columns: GridColDef<FlatRow>[] = React.useMemo(
    () => [
      { field: "whenLocal", headerName: "Date", flex: 1, minWidth: 130 },

      {
        field: "homeName",
        headerName: "Home",
        flex: 1.4,
        minWidth: 150,
        sortable: true,
        renderCell: (p: GridRenderCellParams<FlatRow, string>) => (
          <div className="flex items-center gap-2 truncate">
            {p.row.homeLogo ? (
              <img
                src={p.row.homeLogo}
                alt=""
                style={{ height: 18, width: 18, objectFit: "contain" }}
              />
            ) : null}
            <span className="truncate">{p.value}</span>
          </div>
        ),
      },

      {
        field: "awayName",
        headerName: "Away",
        flex: 1.4,
        minWidth: 150,
        sortable: true,
        renderCell: (p: GridRenderCellParams<FlatRow, string>) => (
          <div className="flex items-center gap-2 truncate">
            {p.row.awayLogo ? (
              <img
                src={p.row.awayLogo}
                alt=""
                style={{ height: 18, width: 18, objectFit: "contain" }}
              />
            ) : null}
            <span className="truncate">{p.value}</span>
          </div>
        ),
      },

      { field: "score", headerName: "Score", width: 90, headerAlign: "center", align: "center" },

      {
        field: "statusShort",
        headerName: "Status",
        width: 100,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: (p: GridRenderCellParams<FlatRow, string>) => (
          <Badge code={p.value ?? ""} title={p.row.statusLong} />
        ),
      },

      { field: "venue", headerName: "Venue", flex: 1.6, minWidth: 160 },

      // ΝΕΕΣ ΣΤΗΛΕΣ (χωρίς valueGetter/any)
      {
        field: "round",
        headerName: "Round",
        flex: 1,
        minWidth: 140,
        renderCell: (p: GridRenderCellParams<FlatRow, string | null>) => (
          <span>{p.row.round ?? "—"}</span>
        ),
      },
      {
        field: "referee",
        headerName: "Referee",
        flex: 1,
        minWidth: 140,
        renderCell: (p: GridRenderCellParams<FlatRow, string | null>) => (
          <span>{p.row.referee ?? "—"}</span>
        ),
      },
      {
        field: "elapsed",
        headerName: "Elapsed",
        width: 90,
        headerAlign: "center",
        align: "center",
        sortable: false,
        renderCell: (p: GridRenderCellParams<FlatRow, number | null>) => (
          <span>{p.row.elapsed != null ? `${p.row.elapsed}′` : "—"}</span>
        ),
      },
    ],
    []
  );

  return (
    <div style={{ height, width: "100%" }}>
      <DataGrid
        rows={flatRows}
        columns={columns}
        getRowId={(r) => r.id}
        loading={!!loading}
        pageSizeOptions={[10, 20, 50]}
        initialState={{ pagination: { paginationModel: { pageSize, page: 0 } } }}
        disableColumnMenu
        disableRowSelectionOnClick
      />
    </div>
  );
}
