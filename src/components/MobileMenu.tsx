import { useEffect, useRef } from "react";
import { NavLink } from "react-router-dom";

type Props = {
  open: boolean;
  onClose: () => void;
};

export default function MobileMenu({ open, onClose }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onEsc);
    };
  }, [open, onClose]);

  if (!open) return null;

  const linkBase =
    "px-4 py-2 text-sm hover:bg-gray-100 transition-colors aria-[current=page]:font-semibold";

  return (
    <>
      {/* Backdrop for click-out (no shadow) */}
      <div
        className="fixed inset-0 z-40 md:hidden"
        aria-hidden="true"
      />

      {/* Drawer: does not depend on the page layout */}
      <div
        ref={ref}
        id="mobile-menu"
        role="dialog"
        aria-label="Mobile navigation"
        className="fixed top-16 right-2 z-50 md:hidden w-56 rounded-lg border bg-white shadow-lg"
      >
        <nav className="flex flex-col">
          <NavLink to="/" end className={linkBase} onClick={onClose}>
            Dashboard
          </NavLink>
          <NavLink to="/fixtures" className={linkBase} onClick={onClose}>
            Fixtures
          </NavLink>
          <NavLink to="/teams" className={linkBase} onClick={onClose}>
            Teams
          </NavLink>
          <NavLink to="/players" className={linkBase} onClick={onClose}>
            Players
          </NavLink>
          <NavLink to="/h2h" className={linkBase} onClick={onClose}>
            H2H
          </NavLink>
        </nav>
      </div>
    </>
  );
}
