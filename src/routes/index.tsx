import { createBrowserRouter } from "react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { PublicRoute } from "@/components/layout/public-route";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/",
            lazy: () => import("./login"),
          },
        ],
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <AppLayout />,
        children: [
          { path: "/app", lazy: () => import("./app/dashboard") },
          { path: "/app/financeiro/lancamentos", lazy: () => import("./app/financeiro/lancamentos/page") },
          { path: "/app/financeiro/contas-pagar", lazy: () => import("./app/financeiro/contas-pagar/page") },
          { path: "/app/financeiro/contas-receber", lazy: () => import("./app/financeiro/contas-receber/page") },
          { path: "/app/financeiro/categorias", lazy: () => import("./app/financeiro/categorias/page") },
          { path: "/app/financeiro/centros-custo", lazy: () => import("./app/financeiro/centros-custo/page") },
          { path: "/app/financeiro/dre", lazy: () => import("./app/financeiro/dre/page") },
          { path: "/app/financeiro/fluxo-caixa", lazy: () => import("./app/financeiro/fluxo-caixa/page") },
          { path: "/app/relatorios", lazy: () => import("./app/relatorios/page") },
          { path: "/app/relatorios/financeiros", lazy: () => import("./app/relatorios/financeiros/page") },
          { path: "/app/relatorios/centros-custo", lazy: () => import("./app/relatorios/centros-custo/page") },
          { path: "/app/cadastros/clientes", lazy: () => import("./app/cadastros/clientes/page") },
          { path: "/app/cadastros/fornecedores", lazy: () => import("./app/cadastros/fornecedores/page") },
          { path: "/app/configuracoes", lazy: () => import("./app/configuracoes/page") },
          { path: "/app/admin", lazy: () => import("./app/admin/page") },
        ],
      },
    ],
  },
]);
