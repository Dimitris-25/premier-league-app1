import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AppLayout from "./layouts/AppLayout";
import Dashboard from "./pages/Dashboard";
import Fixtures from "./pages/Fixtures";
import H2H from "./pages/H2H";
import Teams from "./pages/Teams";
import Players from "./pages/Players";
import PlayersTop from "./pages/PlayersTop";
import PlayerDetails from "./pages/PlayersDetails";
import TeamDetails from "./pages/TeamDetails";


export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="fixtures" element={<Fixtures />} />
          <Route path="h2h" element={<H2H />} />
          <Route path="teams" element={<Teams />} />
          <Route path="players" element={<Players />} />
          <Route path="players/top" element={<PlayersTop />} />
          <Route path="players/:id" element={<PlayerDetails />} />
          <Route path="teams/:id" element={<TeamDetails />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
