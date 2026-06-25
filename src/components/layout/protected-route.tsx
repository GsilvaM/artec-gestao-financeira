import { Navigate, Outlet, useLocation } from "react-router";
import { useAuthStore } from "@/lib/supabase/auth-store";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace />;
  }

  if (location.pathname.startsWith("/app/admin") && profile?.roleName !== "primary_admin" && profile?.roleName !== "admin") {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
