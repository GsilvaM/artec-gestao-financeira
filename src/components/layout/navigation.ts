import type { LucideIcon } from "lucide-react";
import {
  BarChart3,
  Building2,
  CircleDollarSign,
  CreditCard,
  FileText,
  Home,
  ReceiptText,
  RefreshCw,
  Settings,
  ShieldCheck,
  UserRoundCog,
  UsersRound,
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
    icon: Home,
    href: "/app",
  },
  {
    title: "Financeiro",
    icon: CircleDollarSign,
    items: [
      { title: "Financeiro", href: "/app/financeiro/lancamentos" },
      { title: "Contas a pagar", href: "/app/financeiro/contas-pagar" },
      { title: "Contas a receber", href: "/app/financeiro/contas-receber" },
      { title: "Movimentações", href: "/app/financeiro/fluxo-caixa" },
      { title: "Categorias", href: "/app/financeiro/categorias" },
      { title: "Centros de custo", href: "/app/financeiro/centros-custo" },
      { title: "DRE", href: "/app/financeiro/dre" },
    ],
  },
  {
    title: "Gestão",
    icon: UsersRound,
    items: [
      { title: "Relatórios", href: "/app/relatorios" },
      { title: "Clientes", href: "/app/cadastros/clientes" },
      { title: "Fornecedores", href: "/app/cadastros/fornecedores" },
      { title: "Colaboradores", href: "/app/cadastros/colaboradores" },
      { title: "Relatórios financeiros", href: "/app/relatorios/financeiros" },
    ],
  },
  {
    title: "Configurações",
    icon: Settings,
    items: [
      { title: "Configurações", href: "/app/configuracoes" },
      { title: "Admin", href: "/app/admin" },
    ],
  },
];

export const navigationIconMap: Record<string, LucideIcon> = {
  Dashboard: Home,
  Financeiro: CircleDollarSign,
  "Contas a pagar": ReceiptText,
  "Contas a receber": CreditCard,
  Movimentações: RefreshCw,
  Categorias: FileText,
  "Centros de custo": Building2,
  DRE: BarChart3,
  Relatórios: BarChart3,
  Clientes: UsersRound,
  Fornecedores: Building2,
  Colaboradores: UserRoundCog,
  "Relatórios financeiros": FileText,
  Configurações: Settings,
  Admin: ShieldCheck,
};

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
