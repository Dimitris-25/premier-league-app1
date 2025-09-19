// src/components/H2HTable.tsx
import * as React from "react";
import { DataGrid, type GridColDef } from "@mui/x-data-grid";
import type { Match } from "../types/match"; // προσαρμόσε το path

type Props = { rows: Match[] };

export default function H2HTable({ rows }: Props) {
  const columns: GridColDef<Match>[] = [
    {
      field: "date",
      headerName: "Date",
      width: 120,
      valueGetter: (_value, row) =>
        row.date ? new Date(row.date).toLocaleDateString() : "—",
    },
    {
      field: "league",
      headerName: "League",
      width: 150,
      valueGetter: (_value, row) => row.league?.name ?? "—",
    },
    {
      field: "home",
      headerName: "Home",
      width: 160,
      valueGetter: (_value, row) => row.teams?.home?.name ?? "—",
    },
    {
      field: "away",
      headerName: "Away",
      width: 160,
      valueGetter: (_value, row) => row.teams?.away?.name ?? "—",
    },
    {
      field: "score",
      headerName: "Score",
      width: 100,
      valueGetter: (_value, row) =>
        `${row.goals?.home ?? 0} – ${row.goals?.away ?? 0}`,
    },
  ];

  return (
    <div style={{ height: 600, width: "100%" }}>
      <DataGrid
        rows={rows}
        columns={columns}
        getRowId={(r) => r.fixture_id}
        initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
        pageSizeOptions={[5, 10, 20]}
      />
    </div>
  );
}
