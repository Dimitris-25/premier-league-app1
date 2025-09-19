// src/components/ui/AppSidebar.tsx
import { NavLink } from "react-router-dom";
import { cn } from "../lib/cn";
import { LayoutGrid, CalendarDays, Users2, Shield, MapPin } from "lucide-react";

type NavItem = {
  to: string;
  label: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
};

const nav: NavItem[] = [
  { to: "/", label: "Dashboard", icon: LayoutGrid },
  { to: "/fixtures", label: "Fixtures", icon: CalendarDays },
  { to: "/teams", label: "Teams", icon: Shield },
  { to: "/players", label: "Players", icon: Users2 },
  { to: "/h2h", label: "H2H", icon: MapPin },
];

export default function AppSidebar() {
  return (
    <aside className="hidden md:block h-screen w-60 shrink-0 border-r bg-background">
      <div className="h-14 flex items-center px-4 font-semibold">premier-league-stats</div>
      <nav className="px-2 py-2 space-y-1">
        {nav.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }: { isActive: boolean }) =>
              cn(
                "flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground",
                isActive && "bg-accent text-accent-foreground"
              )
            }
            end={to === "/"}
          >
            <Icon className="h-4 w-4" />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
