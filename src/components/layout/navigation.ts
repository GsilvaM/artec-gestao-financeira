import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  DollarSign,
  LayoutDashboard,
  Settings,
  Users,
  Wrench,
} from "lucide-react";

export interface NavigationChild {
  title: string;
  href: string;
}

export interface NavigationItem {
  title: string;
  icon: LucideIcon;
  href?: string;
  items?: NavigationChild[];
}

export const navigationItems: NavigationItem[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/app",
  },
  {
    title: "Financeiro",
    icon: DollarSign,
    items: [
      { title: "Lançamentos", href: "/app/financeiro/lancamentos" },
      { title: "Contas a Receber", href: "/app/financeiro/contas-receber" },
      { title: "Contas a Pagar", href: "/app/financeiro/contas-pagar" },
      { title: "Categorias", href: "/app/financeiro/categorias" },
      { title: "Centros de Custo", href: "/app/financeiro/centros-custo" },
      { title: "DRE", href: "/app/financeiro/dre" },
      { title: "Fluxo de Caixa", href: "/app/financeiro/fluxo-caixa" },
      { title: "Relatórios Financeiros", href: "/app/relatorios/financeiros" },
    ],
  },
  {
    title: "Operacional",
    icon: Wrench,
    items: [
      { title: "Visão Geral", href: "/app/operacional" },
      { title: "Serviços", href: "/app/operacional/servicos" },
      { title: "Cadastro de Serviços", href: "/app/operacional/cadastro-servicos" },
      { title: "Técnicos", href: "/app/operacional/tecnicos" },
      { title: "Colaboradores", href: "/app/operacional/colaboradores" },
      { title: "Produtividade", href: "/app/operacional/produtividade" },
      { title: "Rentabilidade", href: "/app/operacional/rentabilidade" },
    ],
  },
  {
    title: "Cadastros",
    icon: Users,
    items: [
      { title: "Clientes", href: "/app/cadastros/clientes" },
      { title: "Fornecedores", href: "/app/cadastros/fornecedores" },
      { title: "Serviços", href: "/app/operacional/cadastro-servicos" },
      { title: "Técnicos", href: "/app/operacional/tecnicos" },
      { title: "Colaboradores", href: "/app/operacional/colaboradores" },
    ],
  },
  {
    title: "Relatórios",
    icon: BarChart3,
    href: "/app/relatorios",
  },
  {
    title: "Configurações",
    icon: Settings,
    href: "/app/configuracoes",
  },
  {
    title: "Admin",
    icon: Building2,
    href: "/app/admin",
  },
];

export function findNavigationTrail(pathname: string) {
  for (const item of navigationItems) {
    if (item.href && isNavigationActive(pathname, item.href)) {
      return [item.title];
    }
    const child = item.items?.find((subitem) => isNavigationActive(pathname, subitem.href));
    if (child) return [item.title, child.title];
  }
  return ["Dashboard"];
}

export function isNavigationActive(pathname: string, href: string) {
  if (href === "/app") return pathname === "/app";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function isNavigationGroupActive(pathname: string, item: NavigationItem) {
  if (item.href) return isNavigationActive(pathname, item.href);
  return Boolean(item.items?.some((subitem) => isNavigationActive(pathname, subitem.href)));
}
