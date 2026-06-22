import { RouterProvider } from "react-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthInit } from "@/lib/supabase/auth-init";
import { router } from "@/routes";

const queryClient = new QueryClient();

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthInit>
        <RouterProvider router={router} />
        <Toaster richColors />
      </AuthInit>
    </QueryClientProvider>
  );
}
