import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { Bell, ChevronDown, ChevronLeft, ChevronRight, LogOut, Menu, Search, UserCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { cn } from "@/lib/utils";
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
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A]">
      <AppSidebar collapsed={collapsed} onCollapsedChange={setCollapsed} pathname={location.pathname} userEmail={user?.email} onSignOut={handleSignOut} />
      <div className={cn("min-w-0 transition-[padding] duration-200 lg:pl-[264px]", collapsed && "lg:pl-[72px]") }>
        <Topbar pathname={location.pathname} userEmail={user?.email} onOpenMobile={() => setMobileOpen(true)} onSignOut={handleSignOut} />
        <main className="min-w-0 pb-20 lg:pb-16">
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

  function toggleGroup(title: string) {
    setOpenGroups((current) => ({ ...current, [title]: !current[title] }));
  }

  return (
    <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-[#E2E8F0] bg-white shadow-[1px_0_0_rgba(15,23,42,0.02)] transition-[width] duration-200 lg:flex lg:flex-col", collapsed ? "w-[72px]" : "w-[264px]") }>
      <SidebarHeader collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      <SidebarContent>
        {navigationItems.map((item) => (
          <SidebarGroup
            key={item.title}
            item={item}
            pathname={pathname}
            collapsed={collapsed}
            expanded={Boolean(openGroups[item.title])}
            flyoutOpen={flyout === item.title}
            onToggle={() => toggleGroup(item.title)}
            onFlyoutToggle={() => setFlyout((current) => (current === item.title ? null : item.title))}
            onFlyoutClose={() => setFlyout(null)}
          />
        ))}
      </SidebarContent>
      <SidebarFooter collapsed={collapsed} userEmail={userEmail} onSignOut={onSignOut} />
    </aside>
  );
}

function SidebarHeader({ collapsed, onCollapsedChange }: { collapsed: boolean; onCollapsedChange: (collapsed: boolean) => void }) {
  return (
    <div className="flex h-16 items-center gap-3 border-b border-[#E2E8F0] px-3">
      <NavLink to="/app" className="flex min-w-0 flex-1 items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40" aria-label="Ir para Dashboard">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-[#174E8C] text-sm font-bold text-white shadow-sm">AG</span>
        {!collapsed ? <span className="truncate text-sm font-bold tracking-tight text-[#0F172A]">Artec Gestão</span> : null}
      </NavLink>
      <SidebarCollapseButton collapsed={collapsed} onClick={() => onCollapsedChange(!collapsed)} />
    </div>
  );
}

function SidebarCollapseButton({ collapsed, onClick }: { collapsed: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={collapsed ? "Expandir sidebar" : "Recolher sidebar"}
      className="hidden size-9 shrink-0 items-center justify-center rounded-xl border border-[#E2E8F0] bg-white text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40 xl:flex"
    >
      {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
    </button>
  );
}

function SidebarContent({ children }: { children: React.ReactNode }) {
  return <nav className="flex-1 space-y-1 overflow-y-auto overflow-x-visible px-3 py-4" aria-label="Menu principal">{children}</nav>;
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
      <div className="relative">
        <button
          type="button"
          title={item.title}
          aria-label={item.title}
          aria-expanded={flyoutOpen}
          onClick={onFlyoutToggle}
          className={cn("flex h-11 w-full items-center justify-center rounded-2xl text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40", active && "bg-[#EAF3FB] text-[#174E8C]")}
        >
          <Icon className="size-5" />
        </button>
        {flyoutOpen ? (
          <div className="absolute left-[calc(100%+0.75rem)] top-0 z-50 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
            <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wide text-[#94A3B8]">{item.title}</div>
            <SidebarSubmenu items={item.items ?? []} pathname={pathname} onNavigate={onFlyoutClose} />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        aria-expanded={expanded}
        onClick={onToggle}
        className={cn("flex h-11 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40", active && "bg-[#EAF3FB] text-[#174E8C]")}
      >
        <Icon className="size-5 shrink-0" />
        <span className="min-w-0 flex-1 truncate text-left">{item.title}</span>
        <ChevronDown className={cn("size-4 shrink-0 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? <SidebarSubmenu items={item.items ?? []} pathname={pathname} /> : null}
    </div>
  );
}

function SidebarItem({ href, title, icon: Icon, active, collapsed, onNavigate }: { href: string; title: string; icon: NavigationItem["icon"]; active: boolean; collapsed: boolean; onNavigate?: () => void }) {
  return (
    <NavLink
      to={href}
      end={href === "/app"}
      title={collapsed ? title : undefined}
      aria-current={active ? "page" : undefined}
      onClick={onNavigate}
      className={cn("flex h-11 items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40", collapsed && "justify-center px-0", active && "bg-[#EAF3FB] text-[#174E8C]")}
    >
      <Icon className="size-5 shrink-0" />
      {!collapsed ? <span className="truncate">{title}</span> : null}
    </NavLink>
  );
}

function SidebarSubmenu({ items, pathname, onNavigate }: { items: { title: string; href: string }[]; pathname: string; onNavigate?: () => void }) {
  return (
    <div className="mt-1 space-y-1 pl-4">
      {items.map((subitem) => {
        const active = isNavigationActive(pathname, subitem.href);
        return (
          <NavLink
            key={subitem.href}
            to={subitem.href}
            aria-current={active ? "page" : undefined}
            onClick={onNavigate}
            className={cn("block rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40", active && "bg-[#EAF3FB] text-[#174E8C]")}
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
    <div className="border-t border-[#E2E8F0] p-3">
      <div className={cn("mb-3 flex items-center gap-3 rounded-2xl bg-[#F8FAFC] p-3", collapsed && "justify-center p-2")}>
        <UserCircle className="size-5 shrink-0 text-[#174E8C]" />
        {!collapsed ? <div className="min-w-0"><div className="truncate text-sm font-semibold text-[#0F172A]">{userEmail ?? "Usuário"}</div><div className="text-xs text-[#94A3B8]">v0.0.1</div></div> : null}
      </div>
      <Button variant="outline" size={collapsed ? "icon" : "sm"} onClick={onSignOut} className={cn("w-full", collapsed && "w-11")} aria-label="Sair">
        <LogOut className="size-4" />
        {!collapsed ? "Sair" : null}
      </Button>
    </div>
  );
}

function Topbar({ pathname, userEmail, onOpenMobile, onSignOut }: { pathname: string; userEmail?: string; onOpenMobile: () => void; onSignOut: () => void }) {
  return (
    <header className="sticky top-0 z-30 h-16 border-b border-[#E2E8F0] bg-white/90 backdrop-blur-xl">
      <div className="flex h-full min-w-0 items-center gap-3 px-4 sm:px-6 lg:px-8">
        <button type="button" onClick={onOpenMobile} className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40 lg:hidden" aria-label="Abrir menu">
          <Menu className="size-5" />
        </button>
        <Breadcrumbs pathname={pathname} />
        <GlobalSearch />
        <div className="ml-auto flex items-center gap-2">
          <NotificationButton />
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
            {index > 0 ? <span className="text-[#CBD5E1]">/</span> : null}
            <span className={cn("truncate", index === trail.length - 1 ? "font-semibold text-[#0F172A]" : "text-[#64748B]")}>{item}</span>
          </li>
        ))}
      </ol>
    </nav>
  );
}

function GlobalSearch() {
  return (
    <div className="relative ml-2 hidden w-full max-w-sm md:block">
      <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
      <Input className="h-9 rounded-xl bg-[#F8FAFC] pl-9" placeholder="Buscar no sistema..." aria-label="Busca global" />
    </div>
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
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Notificações" aria-expanded={open} className="flex size-10 items-center justify-center rounded-xl border border-[#E2E8F0] text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40">
        <Bell className="size-5" />
      </button>
      {open ? <div className="absolute right-0 top-12 z-50 w-72 rounded-2xl border border-[#E2E8F0] bg-white p-4 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]"><div className="text-sm font-semibold text-[#0F172A]">Notificações</div><p className="mt-1 text-sm text-[#64748B]">Nenhuma notificação nova.</p></div> : null}
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
      <button type="button" onClick={() => setOpen((current) => !current)} aria-label="Menu do usuário" aria-expanded={open} className="flex h-10 items-center gap-2 rounded-xl border border-[#E2E8F0] bg-white px-2.5 text-[#0F172A] transition hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40">
        <UserCircle className="size-5 text-[#174E8C]" />
        <span className="hidden max-w-40 truncate text-sm font-medium sm:block">{userEmail ?? "Usuário"}</span>
        <ChevronDown className="size-4 text-[#94A3B8]" />
      </button>
      {open ? (
        <div className="absolute right-0 top-12 z-50 w-64 rounded-2xl border border-[#E2E8F0] bg-white p-2 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)]">
          <div className="border-b border-[#E2E8F0] px-3 py-2"><div className="truncate text-sm font-semibold text-[#0F172A]">{userEmail ?? "Usuário"}</div><div className="text-xs text-[#94A3B8]">Sessão ativa</div></div>
          <button type="button" onClick={onSignOut} className="mt-2 flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40">
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
      <button type="button" aria-label="Fechar menu" className="absolute inset-0 bg-slate-950/40" onClick={onClose} />
      <aside className="relative flex h-full w-80 max-w-[88vw] flex-col border-r border-[#E2E8F0] bg-white shadow-2xl">
        <div className="flex h-16 items-center justify-between border-b border-[#E2E8F0] px-4">
          <div className="flex items-center gap-3"><span className="flex size-10 items-center justify-center rounded-2xl bg-[#174E8C] text-sm font-bold text-white">AG</span><span className="font-bold text-[#0F172A]">Artec Gestão</span></div>
          <button type="button" onClick={onClose} aria-label="Fechar menu" className="rounded-xl p-2 text-[#64748B] hover:bg-[#F8FAFC] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40"><X className="size-5" /></button>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Menu mobile">
          {navigationItems.map((item) => <MobileNavItem key={item.title} item={item} pathname={pathname} expanded={Boolean(openGroups[item.title])} onToggle={() => setOpenGroups((current) => ({ ...current, [item.title]: !current[item.title] }))} onNavigate={onClose} />)}
        </nav>
        <div className="border-t border-[#E2E8F0] p-4"><div className="mb-3 truncate text-sm font-medium text-[#64748B]">{userEmail ?? "Usuário"}</div><Button onClick={onSignOut} className="w-full"><LogOut className="size-4" />Sair</Button></div>
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
      <button type="button" aria-expanded={expanded} onClick={onToggle} className={cn("flex h-12 w-full items-center gap-3 rounded-2xl px-3 text-sm font-semibold text-[#64748B] transition hover:bg-[#F8FAFC] hover:text-[#174E8C] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2F73B8]/40", active && "bg-[#EAF3FB] text-[#174E8C]") }>
        <Icon className="size-5" /><span className="flex-1 text-left">{item.title}</span><ChevronDown className={cn("size-4 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded ? <SidebarSubmenu items={item.items ?? []} pathname={pathname} onNavigate={onNavigate} /> : null}
    </div>
  );
}
