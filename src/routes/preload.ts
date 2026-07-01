type RouteModuleLoader = () => Promise<unknown>;

export const routeModuleLoaders = {
  "/": () => import("./login"),
  "/app": () => import("./app/dashboard"),
  "/app/financeiro/lancamentos": () =>
    import("./app/financeiro/lancamentos/page"),
  "/app/financeiro/contas-pagar": () =>
    import("./app/financeiro/contas-pagar/page"),
  "/app/financeiro/contas-receber": () =>
    import("./app/financeiro/contas-receber/page"),
  "/app/financeiro/categorias": () =>
    import("./app/financeiro/categorias/page"),
  "/app/financeiro/centros-custo": () =>
    import("./app/financeiro/centros-custo/page"),
  "/app/financeiro/dre": () => import("./app/financeiro/dre/page"),
  "/app/financeiro/fluxo-caixa": () =>
    import("./app/financeiro/fluxo-caixa/page"),
  "/app/relatorios": () => import("./app/relatorios/page"),
  "/app/relatorios/financeiros": () =>
    import("./app/relatorios/financeiros/page"),
  "/app/relatorios/centros-custo": () =>
    import("./app/relatorios/centros-custo/page"),
  "/app/cadastros/clientes": () => import("./app/cadastros/clientes/page"),
  "/app/cadastros/fornecedores": () =>
    import("./app/cadastros/fornecedores/page"),
  "/app/cadastros/colaboradores": () =>
    import("./app/cadastros/colaboradores/page"),
  "/app/configuracoes": () => import("./app/configuracoes/page"),
  "/app/admin": () => import("./app/admin/page"),
} satisfies Record<string, RouteModuleLoader>;

export type AppRoutePath = keyof typeof routeModuleLoaders;

const preloadedRoutes = new Set<AppRoutePath>();
const priorityRoutes: AppRoutePath[] = [
  "/app",
  "/app/financeiro/lancamentos",
  "/app/financeiro/contas-pagar",
  "/app/financeiro/contas-receber",
  "/app/relatorios",
  "/app/configuracoes",
];

export function preloadRoute(path: string) {
  const loader = routeModuleLoaders[path as AppRoutePath];
  if (!loader || preloadedRoutes.has(path as AppRoutePath)) return;

  const routePath = path as AppRoutePath;
  preloadedRoutes.add(routePath);
  void loader().catch(() => preloadedRoutes.delete(routePath));
}

export function preloadNavigationRoutes() {
  const preloadRest = () => {
    for (const path of Object.keys(routeModuleLoaders)) {
      if (path !== "/" && !priorityRoutes.includes(path as AppRoutePath)) {
        preloadRoute(path);
      }
    }
  };

  if (typeof window === "undefined") return;
  void Promise.resolve().then(() => {
    for (const path of priorityRoutes) preloadRoute(path);
  });

  if ("requestIdleCallback" in window) {
    window.requestIdleCallback(preloadRest, { timeout: 1_500 });
    return;
  }

  void Promise.resolve().then(preloadRest);
}
