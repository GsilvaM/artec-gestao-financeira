import { createBrowserRouter } from "react-router";
import { AuthLayout } from "@/components/layout/auth-layout";
import { AppLayout } from "@/components/layout/app-layout";
import { ProtectedRoute } from "@/components/layout/protected-route";
import { PublicRoute } from "@/components/layout/public-route";
import { routeModuleLoaders } from "./preload.js";

export const router = createBrowserRouter([
  {
    element: <PublicRoute />,
    children: [
      {
        element: <AuthLayout />,
        children: [
          {
            path: "/",
            lazy: routeModuleLoaders["/"],
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
          { path: "/app", lazy: routeModuleLoaders["/app"] },
          {
            path: "/app/financeiro/lancamentos",
            lazy: routeModuleLoaders["/app/financeiro/lancamentos"],
          },
          {
            path: "/app/financeiro/contas-pagar",
            lazy: routeModuleLoaders["/app/financeiro/contas-pagar"],
          },
          {
            path: "/app/financeiro/contas-receber",
            lazy: routeModuleLoaders["/app/financeiro/contas-receber"],
          },
          {
            path: "/app/financeiro/categorias",
            lazy: routeModuleLoaders["/app/financeiro/categorias"],
          },
          {
            path: "/app/financeiro/centros-custo",
            lazy: routeModuleLoaders["/app/financeiro/centros-custo"],
          },
          {
            path: "/app/financeiro/dre",
            lazy: routeModuleLoaders["/app/financeiro/dre"],
          },
          {
            path: "/app/financeiro/fluxo-caixa",
            lazy: routeModuleLoaders["/app/financeiro/fluxo-caixa"],
          },
          {
            path: "/app/relatorios",
            lazy: routeModuleLoaders["/app/relatorios"],
          },
          {
            path: "/app/relatorios/financeiros",
            lazy: routeModuleLoaders["/app/relatorios/financeiros"],
          },
          {
            path: "/app/relatorios/centros-custo",
            lazy: routeModuleLoaders["/app/relatorios/centros-custo"],
          },
          {
            path: "/app/cadastros/clientes",
            lazy: routeModuleLoaders["/app/cadastros/clientes"],
          },
          {
            path: "/app/cadastros/fornecedores",
            lazy: routeModuleLoaders["/app/cadastros/fornecedores"],
          },
          {
            path: "/app/cadastros/colaboradores",
            lazy: routeModuleLoaders["/app/cadastros/colaboradores"],
          },
          {
            path: "/app/configuracoes",
            lazy: routeModuleLoaders["/app/configuracoes"],
          },
          { path: "/app/admin", lazy: routeModuleLoaders["/app/admin"] },
        ],
      },
    ],
  },
]);
