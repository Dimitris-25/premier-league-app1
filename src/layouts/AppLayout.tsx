import { Outlet, useLocation } from "react-router-dom";
import AppSidebar from "../components/AppSidebar";
import Topbar from "../components/AppTopBar";

// Titles per base path
const TITLES: Record<string, string> = {
  "/": "Dashboard",
  "/fixtures": "Fixtures",
  "/h2h": "Head-to-head",
  "/teams": "Teams",
  "/players": "Players",
  "/players/top": "Top players",
  "/players/details": "Details",
  "/transfers": "Transfers",
  "/seasons": "Seasons",
  "/teams-stats-files": "Team stats (files)",
};

function titleFor(pathname: string) {
  // Longest-prefix match (π.χ. /teams/123 -> "Teams")
  const key = Object.keys(TITLES)
    .sort((a, b) => b.length - a.length)
    .find((k) => pathname === k || pathname.startsWith(k + "/"));
  return key ? TITLES[key] : "Dashboard";
}

export default function AppLayout() {
  const { pathname } = useLocation();
  const title = titleFor(pathname);

  return (
    <div className="min-h-screen flex">
      <AppSidebar />
      <div className="flex-1 flex flex-col min-w-0 w-full">
        <Topbar title={title} />
        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
