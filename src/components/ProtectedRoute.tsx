// src/components/ProtectedRoute.tsx
import { useEffect } from "react";
import { Outlet } from "react-router-dom";

type Props = { children?: React.ReactNode };

export default function ProtectedRoute({ children }: Props) {
  const authed = !!localStorage.getItem("auth_token");

  useEffect(() => {
    if (!authed) {
      // Άνοιξε τη φόρμα login στο Topbar αντί για redirect
      window.dispatchEvent(new Event("ui:open-signin"));
    }
  }, [authed]);

  if (!authed) return null;
  return children ? <>{children}</> : <Outlet />;
}
