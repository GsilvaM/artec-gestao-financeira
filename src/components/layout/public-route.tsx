import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/lib/supabase/auth-store";

export function PublicRoute() {
  const user = useAuthStore((s) => s.user);

  if (user) {
    return <Navigate to="/app" replace />;
  }

  return <Outlet />;
}
