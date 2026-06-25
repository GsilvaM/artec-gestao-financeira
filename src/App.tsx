import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthInit } from "@/lib/supabase/auth-init";
import { router } from "@/routes";
import { useThemeStore } from "@/stores/theme";

const queryClient = new QueryClient();

export function App() {
  const theme = useThemeStore((state) => state.theme);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        <RouterProvider router={router} />
        <Toaster richColors theme={theme} />
      </AuthInit>
    </QueryClientProvider>
  );
}
