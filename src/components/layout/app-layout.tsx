import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Moon, Search, Sun, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme";
import {
  findNavigationTrail,
  isNavigationActive,
  isNavigationGroupActive,
  navigationItems,
  type NavigationItem,
} from "./navigation";

const SIDEBAR_STORAGE_KEY = "artec.sidebar.collapsed";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(SIDEBAR_STORAGE_KEY) === "true");
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <a href="#conteudo-principal" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-card focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-primary focus:shadow-lg focus:outline-none focus:ring-2 focus:ring-ring/40">
        Pular para o conteudo
      </a>
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} pathname={location.pathname} userEmail={user?.email} onSignOut={handleSignOut} />
      <div className={cn("min-w-0 transition-[padding] duration-200 lg:pl-[264px]", collapsed && "lg:pl-[72px]")}>
        <Topbar pathname={location.pathname} userEmail={user?.email} mobileOpen={mobileOpen} onOpenMobile={() => setMobileOpen(true)} onSignOut={handleSignOut} />
        <main id="conteudo-principal" tabIndex={-1} className="min-w-0 pb-20 outline-none lg:pb-16">
          <Outlet />
        </main>
      </div>
      <MobileNavDrawer open={mobileOpen} pathname={location.pathname} userEmail={user?.email} onClose={() => setMobileOpen(false)} onSignOut={handleSignOut} />
    </div>
  );
}

interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  pathname: string;
  userEmail?: string;
  onSignOut: () => void;
}

function AppSidebar({ collapsed, onCollapsedChange, pathname, userEmail, onSignOut }: SidebarProps) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Financeiro: true, Operacional: true, Cadastros: true });
  const [flyout, setFlyout] = useState<string | null>(null);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setFlyout(null);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-border bg-card text-foreground shadow-[1px_0_0_rgba(15,23,42,0.04)] transition-[width] duration-200 lg:flex lg:flex-col", collapsed ? "w-[72px]" : "w-[264px]")}>
      <SidebarHeader collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      <nav className={cn("flex-1 space-y-1 px-3 py-4", collapsed ? "overflow-visible" : "overflow-y-auto overflow-x-hidden")} aria-label="Menu principal">
        {navigationItems.map((item) => (
          <SidebarGroup
            key={item.title}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            expanded={Boolean(openGroups[item.title])}
            flyoutOpen={flyout === item.title}
            onToggle={() => setOpenGroups((current) => ({ ...current, [item.title]: !current[item.title] }))}
            onFlyoutToggle={() => setFlyout((current) => (current === item.title ? null : item.title))}
            onFlyoutClose={() => setFlyout(null)}
          />
        ))}
      </nav>
      <SidebarFooter collapsed={collapsed} userEmail={userEmail} onSignOut={onSignOut} />
    </aside>
  );
}

function SidebarHeader({ collapsed, onCollapsedChange }: { collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void }) {
  return (
    <div className="relative flex h-16 items-center gap-3 border-b border-border px-3">
      <NavLink to="/app" className="flex min-w-0 flex-1 items-center gap-3 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35" aria-label="Ir para Dashboard">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground shadow-sm">AG</span>
        {!collapsed ? <span className="truncate text-sm font-bold tracking-tight text-foreground">Artec Gestao</span> : null}
      </NavLink>
      <button
        type="button"
        onClick={() => onCollapsedChange(!collapsed)}
        aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        title={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
        className={cn(
          "flex size-9 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
          collapsed && "absolute right-0 top-1/2 size-8 -translate-y-1/2 translate-x-1/2 shadow-sm",
        )}
      >
        {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
      </button>
    </div>
  );
}

interface SidebarGroupProps {
  item: NavigationItem;
  pathname: string;
  collapsed: boolean;
  expanded: boolean;
  flyoutOpen: boolean;
  onToggle: () => void;
  onFlyoutToggle: () => void;
  onFlyoutClose: () => void;
}

function SidebarGroup({ item, pathname, collapsed, expanded, flyoutOpen, onToggle, onFlyoutToggle, onFlyoutClose }: SidebarGroupProps) {
  const active = isNavigationGroupActive(pathname, item);
  const Icon = item.icon;

  if (!item.items?.length && item.href) {
    return <SidebarItem href={item.href} title={item.title} icon={Icon} active={active} collapsed={collapsed} />;
  }

  if (collapsed) {
    return (
      <div className="relative" onMouseLeave={onFlyoutClose}>
        <button type="button" title={item.title} aria-label={item.title} aria-expanded={flyoutOpen} onClick={onFlyoutToggle} className={sidebarItemClasses(active, true)}>
          <Icon className="size-5" />
        </button>
        {flyoutOpen ? (
          <div className="absolute left-[calc(100%+0.75rem)] top-0 z-50 w-64 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-soft)]">
            <div className="px-3 py-2 text-xs font-semibold uppercase text-muted-foreground">{item.title}</div>
            <SidebarSubmenu items={item.items ?? []} pathname={pathname} onNavigate={onFlyoutClose} popover />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button type="button" aria-expanded={expanded} onClick={onToggle} className={sidebarItemClasses(active)}>
        <Icon className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform duration-200 ease-in-out", expanded && "rotate-180")} />
      </button>
      {expanded ? <SidebarSubmenu items={item.items ?? []} pathname={pathname} /> : null}
    </div>
  );
}

function sidebarItemClasses(active: boolean, collapsed = false) {
  return cn(
    "flex h-10 w-full items-center gap-3 rounded-md px-3 text-sm font-semibold text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/35",
    collapsed && "justify-center px-0",
    active && "bg-primary/10 text-primary shadow-sm hover:bg-primary/12 hover:text-primary",
  );
}

function SidebarItem({ href, title, icon: Icon, active, collapsed, onNavigate }: { href: string; title: string; icon: NavigationItem["icon"]; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink to={href} end={href === "/app"} title={collapsed ? title : undefined} aria-current={active ? "page" : undefined} onClick={onNavigate} className={sidebarItemClasses(active, collapsed)}>
      <Icon className="size-5 shrink-0" />
      {!collapsed ? <span className="truncate">{title}</span> : null}
    </NavLink>
  );
}

function SidebarSubmenu({ items, pathname, onNavigate, popover = false }: { items: { title: string; href: string }[]; pathname: string; onNavigate?: () => void; popover?: boolean }) {
  return (
    <div className={cn("mt-1 space-y-1", popover ? "pl-0" : "pl-4")}>
      {items.map((subitem) => {
        const active = isNavigationActive(pathname, subitem.href);
        return (
          <NavLink
            key={subitem.href}
            to={subitem.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn(
              "block rounded-md px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2",
              "text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:ring-ring/35",
              active && "bg-primary/10 text-primary",
            )}
          >
            {subitem.title}
          </NavLink>
        );
      })}
    </div>
  );
}

function SidebarFooter({ collapsed, userEmail, onSignOut }: { collapsed: boolean; userEmail?: string; onSignOut: () => void }) {
  return (
    <div className="border-t border-border p-3">
      <div className={cn("mb-3 flex items-center gap-3 rounded-md bg-muted/60 p-3", collapsed && "justify-center p-2")}>
        <UserCircle className="size-5 shrink-0 text-primary" />
        {!collapsed ? (
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-foreground">{userEmail ?? "Usuario"}</div>
            <div className="text-xs text-muted-foreground">v0.0.1</div>
          </div>
        ) : null}
      </div>
      <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={onSignOut} className={cn("w-full", collapsed && "w-10")} aria-label="Sair">
        <LogOut className="size-4" />
        {!collapsed ? "Sair" : null}
      </Button>
    </div>
  );
}

function Topbar({ pathname, userEmail, mobileOpen, onOpenMobile, onSignOut }: { pathname: string; userEmail?: string; mobileOpen: boolean; onOpenMobile: () => void; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/88 backdrop-blur-xl">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMobile} className="flex size-10 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 lg:hidden" aria-label="Abrir menu" aria-expanded={mobileOpen} aria-controls="menu-mobile">
          <Menu className="size-5" />
        </button>
        <Breadcrumbs pathname={pathname} />
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-2">
          <NotificationButton />
          <ThemeToggle />
          <UserMenu userEmail={userEmail} onSignOut={onSignOut} />
        </div>
      </div>
    </header>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const trail = useMemo(() => findNavigationTrail(pathname), [pathname]);
  return (
    <nav className="min-w-0" aria-label="Breadcrumb">
      <ol className="flex min-w-0 items-center gap-2 text-sm">
        {trail.map((item, index) => (
          <li key={`${item}-${index}`} className="flex min-w-0 items-center gap-2">
            {index > 0 ? <span className="text-border">/</span> : null}
            <span className={cn("truncate", index === trail.length - 1 ? "font-semibold text-foreground" : "text-muted-foreground")}>{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function GlobalSearch() {
  return (
    <div className="relative ml-2 hidden w-full max-w-sm md:block">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input className="h-9 bg-card pl-9" placeholder="Buscar no sistema..." aria-label="Busca global" />
    </div>
  );
}

function IconButton({ children, label, onClick, expanded }: { children: React.ReactNode; label: string; onClick?: () => void; expanded?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} aria-expanded={expanded} className="flex size-10 items-center justify-center rounded-md border border-border bg-card text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
      {children}
    </button>
  );
}

function ThemeToggle() {
  const theme = useThemeStore((state) => state.theme);
  const toggleTheme = useThemeStore((state) => state.toggleTheme);
  return (
    <IconButton label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"} onClick={toggleTheme}>
      {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
    </IconButton>
  );
}

function NotificationButton() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <div className="relative">
      <IconButton label="Notificacoes" expanded={open} onClick={() => setOpen((current) => !current)}>
        <Bell className="size-5" />
      </IconButton>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-72 rounded-lg border border-border bg-popover p-4 text-popover-foreground shadow-[var(--shadow-soft)]">
          <div className="text-sm font-semibold text-foreground">Notificacoes</div>
          <p className="mt-1 text-sm text-muted-foreground">Nenhuma notificacao nova.</p>
        </div>
      ) : null}
    </div>
  );
}

function UserMenu({ userEmail, onSignOut }: { userEmail?: string; onSignOut: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Menu do usuario" aria-expanded={open} className="flex h-10 items-center gap-2 rounded-md border border-border bg-card px-2.5 text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
        <UserCircle className="size-5 text-primary" />
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{userEmail ?? "Usuario"}</span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform duration-200", open && "rotate-180")} />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-lg border border-border bg-popover p-2 text-popover-foreground shadow-[var(--shadow-soft)]">
          <div className="border-b border-border px-3 py-2">
            <div className="truncate text-sm font-semibold text-foreground">{userEmail ?? "Usuario"}</div>
            <div className="text-xs text-muted-foreground">Sessao ativa</div>
          </div>
          <button type="button" onClick={onSignOut} className="mt-2 flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40">
            <LogOut className="size-4" />
            Sair
          </button>
        </div>
      ) : null}
    </div>
  );
}

function MobileNavDrawer({ open, pathname, userEmail, onClose, onSignOut }: { open: boolean; pathname: string; userEmail?: string; onClose: () => void; onSignOut: () => void }) {
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Financeiro: true, Operacional: true, Cadastros: true });

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]" onClick={onClose} />
      <aside id="menu-mobile" role="dialog" aria-modal="true" aria-label="Menu principal" className="relative flex h-full w-80 max-w-[88vw] flex-col border-r border-border bg-card text-foreground shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-border px-4">
          <div className="flex items-center gap-3">
            <span className="flex size-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-primary-foreground">AG</span>
            <span className="font-bold text-foreground">Artec Gestao</span>
          </div>
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30">
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Menu mobile">
          {navigationItems.map((item) => (
            <MobileNavItem key={item.title} item={item} pathname={pathname} expanded={Boolean(openGroups[item.title])} onToggle={() => setOpenGroups((current) => ({ ...current, [item.title]: !current[item.title] }))} onNavigate={onClose} />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="mb-3 truncate text-sm font-medium text-muted-foreground">{userEmail ?? "Usuario"}</div>
          <Button onClick={onSignOut} className="w-full">
            <LogOut className="size-4" />
            Sair
          </Button>
        </div>
      </aside>
    </div>
  );
}

function MobileNavItem({ item, pathname, expanded, onToggle, onNavigate }: { item: NavigationItem; pathname: string; expanded: boolean; onToggle: () => void; onNavigate: () => void }) {
  const active = isNavigationGroupActive(pathname, item);
  const Icon = item.icon;
  if (!item.items?.length && item.href) {
    return <SidebarItem href={item.href} title={item.title} icon={Icon} active={active} collapsed={false} onNavigate={onNavigate} />;
  }
  return (
    <div>
      <button type="button" aria-expanded={expanded} onClick={onToggle} className={sidebarItemClasses(active)}>
        <Icon className="size-5" />
        <span className="flex-1 text-left">{item.title}</span>
        <ChevronDown className={cn("size-4 transition-transform duration-200 ease-in-out", expanded && "rotate-180")} />
      </button>
      {expanded ? <SidebarSubmenu items={item.items ?? []} pathname={pathname} onNavigate={onNavigate} /> : null}
    </div>
  );
}
