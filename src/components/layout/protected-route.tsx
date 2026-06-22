import { Navigate, Outlet } from "react-router";
import { useAuthStore } from "@/lib/supabase/auth-store";

export function ProtectedRoute() {
  const user = useAuthStore((s) => s.user);

  if (!user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
