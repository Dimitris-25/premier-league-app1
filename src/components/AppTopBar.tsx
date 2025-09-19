import { Button } from "../components/ui/button";
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import SignIn from "../components/Sign-In";
import SignUp from "../components/Sign-Up";

type Props = { title?: string };

export default function Topbar({ title }: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [authed, setAuthed] = useState<boolean>(!!localStorage.getItem("auth_token"));
  const [mode, setMode] = useState<"signin" | "signup">("signin");

  const popRef = useRef<HTMLDivElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!isOpen) return;
      if (popRef.current && !popRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setAuthed(!!localStorage.getItem("auth_token"));
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setIsOpen(false);
        setAuthed(!!localStorage.getItem("auth_token"));
      }
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isOpen]);

  useEffect(() => {
    const onAuth = () => setAuthed(!!localStorage.getItem("auth_token"));
    window.addEventListener("auth:login", onAuth as EventListener);
    window.addEventListener("auth:logout", onAuth as EventListener);
    window.addEventListener("storage", onAuth as EventListener);
    return () => {
      window.removeEventListener("auth:login", onAuth as EventListener);
      window.removeEventListener("auth:logout", onAuth as EventListener);
      window.removeEventListener("storage", onAuth as EventListener);
    };
  }, []);

  useEffect(() => {
    const openIn = () => { setMode("signin"); setIsOpen(true); };
    const openUp = () => { setMode("signup"); setIsOpen(true); };
    window.addEventListener("ui:open-signin", openIn as EventListener);
    window.addEventListener("ui:open-signup", openUp as EventListener);
    return () => {
      window.removeEventListener("ui:open-signin", openIn as EventListener);
      window.removeEventListener("ui:open-signup", openUp as EventListener);
    };
  }, []);

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!menuOpen) return;
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onEsc);
    };
  }, [menuOpen]);

  // auto-close menu
  useEffect(() => {
    if (menuOpen) setMenuOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return (
    <header className="border-b bg-background">
      <div className="container mx-auto px-2 md:px-4 h-16 flex items-center justify-between relative">
        <div className="flex items-center gap-1 sm:gap-2">
          <input
            placeholder="Search…"
            className="h-8 w-28 text-xs sm:h-9 sm:w-40 sm:text-sm md:h-12 md:w-60 rounded-md border bg-transparent px-2 outline-none"
          />
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          {authed ? (
            <Button
              size="sm"
              className="flex items-center justify-center px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm text-blue-600 border border-blue-600 hover:bg-blue-50"
              onClick={() => {
                localStorage.removeItem("auth_token");
                window.dispatchEvent(new Event("auth:logout"));
              }}
            >
              Logout
            </Button>
          ) : (
            <div className="relative" ref={popRef}>
              <Button
                type="button"
                onClick={() => { setMode("signin"); setIsOpen(v => !v); }}
                size="sm"
                className="flex items-center justify-center px-2 py-1 text-xs sm:px-3 sm:py-1.5 sm:text-sm text-blue-600 border border-blue-600 hover:bg-blue-50"
              >
                Sign in
              </Button>

              {isOpen && (
                <div className="absolute right-0 top-10 z-50 w-[90vw] md:w-[520px] max-h-[80vh] overflow-auto rounded-lg border bg-background p-3 shadow-lg">
                  {mode === "signin" ? <SignIn /> : <SignUp />}
                </div>
              )}
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            type="button"
            className="md:hidden p-1.5 sm:p-2 rounded hover:bg-gray-100"
            onClick={() => setMenuOpen(v => !v)}
            aria-label="Menu"
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
          >
            ☰
          </button>

          {/* Mobile Menu ) */}
          {menuOpen && (
            <div
              ref={menuRef}
              id="mobile-menu"
              className="md:hidden absolute top-14 right-0 z-50 w-56 rounded-lg border bg-white shadow-md"
              role="dialog"
              aria-label="Mobile navigation"
            >
              <nav className="flex flex-col">
                <NavLink
                  to="/"
                  end
                  className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=page]:font-semibold"
                >
                  Dashboard
                </NavLink>
                <NavLink
                  to="/fixtures"
                  className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=page]:font-semibold"
                >
                  Fixtures
                </NavLink>
                <NavLink
                  to="/teams"
                  className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=page]:font-semibold"
                >
                  Teams
                </NavLink>
                <NavLink
                  to="/players"
                  className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=page]:font-semibold"
                >
                  Players
                </NavLink>
                <NavLink
                  to="/h2h"
                  className="px-4 py-2 text-sm hover:bg-gray-100 aria-[current=page]:font-semibold"
                >
                  H2H
                </NavLink>
              </nav>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
