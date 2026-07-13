import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Menu,
  Moon,
  Sun,
  X,
  type LucideIcon,
} from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { Button, IconButton } from "@/components/ui/button";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme";
import { preloadNavigationRoutes, preloadRoute } from "@/routes/preload";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  findNavigationTrail,
  isNavigationActive,
  isNavigationGroupActive,
  navigationIconMap,
  navigationItems,
  type NavigationItem,
  } from "./navigation.js";

function useSidebarCollapsed() {
  const [collapsed, setCollapsed] = useState(() => {
    try {
      return localStorage.getItem("sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  const toggle = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("sidebar-collapsed", String(next));
      } catch {
        /* noop */
      }
      return next;
    });
  }, []);

  return { collapsed, toggle };
}

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { collapsed, toggle: toggleSidebar } = useSidebarCollapsed();
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const location = useLocation();
  const isDesktop = !useMediaQuery("(max-width: 1023px)");

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (isDesktop && mobileOpen) {
      setMobileOpen(false);
    }
  }, [isDesktop, mobileOpen]);

  useEffect(() => {
    preloadNavigationRoutes();
  }, []);

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className={cn("app-shell", collapsed && "sidebar-collapsed")}>
      <a
        href="#conteudo-principal"
        className="focus:bg-surface focus:text-primary focus:shadow-card focus:ring-primary/28 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-[14px] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:ring-[3px] focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <AppSidebar
        collapsed={collapsed}
        pathname={location.pathname}
        userEmail={user?.email}
        onSignOut={handleSignOut}
        onToggleCollapse={toggleSidebar}
      />
      <div className="app-main">
        <Topbar
          pathname={location.pathname}
          userEmail={user?.email}
          mobileOpen={mobileOpen}
          onOpenMobile={() => setMobileOpen(true)}
          onSignOut={handleSignOut}
        />
        <main id="conteudo-principal" tabIndex={-1} className="outline-none">
          <Outlet />
        </main>
        <MobileBottomNav pathname={location.pathname} />
      </div>
      <MobileNavDrawer
        open={mobileOpen}
        pathname={location.pathname}
        userEmail={user?.email}
        onClose={() => setMobileOpen(false)}
        onSignOut={handleSignOut}
      />
    </div>
  );
}

function AppSidebar({
  collapsed,
  pathname,
  userEmail,
  onSignOut,
  onToggleCollapse,
}: {
  collapsed: boolean;
  pathname: string;
  userEmail?: string;
  onSignOut: () => void;
  onToggleCollapse: () => void;
}) {
  const collapseLabel = collapsed ? "Expandir menu" : "Recolher menu";

  return (
    <>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar-logo">
          <NavLink
            to="/app"
            aria-label="Ir para Dashboard"
            onFocus={() => preloadRoute("/app")}
            onMouseEnter={() => preloadRoute("/app")}
            onPointerDown={() => preloadRoute("/app")}
            className={cn("sidebar-logo-link", collapsed && "justify-center")}
          >
            <AppLogo compact={collapsed} />
          </NavLink>
          <IconButton
            onClick={onToggleCollapse}
            aria-label={collapseLabel}
            title={collapseLabel}
            className="sidebar-collapse-btn"
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </IconButton>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <SidebarGroup
              key={item.title}
              item={item}
              pathname={pathname}
              collapsed={collapsed}
            />
          ))}
        </nav>

        <SidebarFooter
          collapsed={collapsed}
          userEmail={userEmail}
          onSignOut={onSignOut}
        />
      </aside>
      <style>{sidebarStyles}</style>
    </>
  );
}

function SidebarGroup({
  item,
  pathname,
  collapsed,
}: {
  item: NavigationItem;
  pathname: string;
  collapsed?: boolean;
}) {
  const active = isNavigationGroupActive(pathname, item);
  const Icon = item.icon;

  if (!item.items?.length && item.href) {
    const href = item.href;
    return (
      <div>
        <NavLink
          to={href}
          end={href === "/app"}
          onFocus={() => preloadRoute(href)}
          onMouseEnter={() => preloadRoute(href)}
          onPointerDown={() => preloadRoute(href)}
          className={cn(
            "sidebar-link",
            collapsed && "sidebar-link-collapsed",
            active && "sidebar-link-active"
          )}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={20} />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </div>
    );
  }

  return (
    <div>
      {!collapsed && <p className="sidebar-group-label">{item.title}</p>}
      {item.items?.map((subitem) => {
        const subActive = isNavigationActive(pathname, subitem.href);
        const SubIcon = navigationIconMap[subitem.title];
        return (
          <NavLink
            key={subitem.href}
            to={subitem.href}
            onFocus={() => preloadRoute(subitem.href)}
            onMouseEnter={() => preloadRoute(subitem.href)}
            onPointerDown={() => preloadRoute(subitem.href)}
            className={cn(
              "sidebar-link",
              collapsed && "sidebar-link-collapsed",
              subActive && "sidebar-link-active"
            )}
            aria-current={subActive ? "page" : undefined}
          >
            {SubIcon && <SubIcon size={20} />}
            {!collapsed && <span>{subitem.title}</span>}
          </NavLink>
        );
      })}
    </div>
  );
}

function SidebarFooter({
  collapsed,
  userEmail,
  onSignOut,
}: {
  collapsed?: boolean;
  userEmail?: string;
  onSignOut: () => void;
}) {
  const initials =
    (userEmail ?? "U")
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className={cn("sidebar-user", collapsed && "sidebar-user-collapsed")}>
      <div className="sidebar-user-avatar">{initials}</div>
      {!collapsed && (
        <div className="min-w-0 flex-1">
          <div className="sidebar-user-name truncate">
            {userEmail?.split("@")[0] ?? "Usuário"}
          </div>
          <div className="sidebar-user-role truncate">
            {userEmail ?? "Administrador"}
          </div>
        </div>
      )}
      <IconButton
        onClick={onSignOut}
        aria-label="Sair"
        className="size-10 rounded-lg bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
      >
        <LogOut size={16} />
      </IconButton>
    </div>
  );
}

function Topbar({
  pathname,
  userEmail,
  mobileOpen,
  onOpenMobile,
  onSignOut,
}: {
  pathname: string;
  userEmail?: string;
  mobileOpen: boolean;
  onOpenMobile: () => void;
  onSignOut: () => void;
}) {
  const trail = useMemo(() => findNavigationTrail(pathname), [pathname]);
  const currentPage = trail.at(-1) ?? "Dashboard";

  return (
    <header className="topbar">
      <IconButton
        onClick={onOpenMobile}
        className="mobile-menu-button"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="menu-mobile"
      >
        <Menu size={20} />
      </IconButton>
      <div className="mobile-page-title" aria-live="polite">
        <span>{currentPage}</span>
      </div>
      <Breadcrumbs pathname={pathname} />
      <div className="topbar-actions">
        <ThemeToggle />
        <UserMenu userEmail={userEmail} onSignOut={onSignOut} />
      </div>
    </header>
  );
}

function Breadcrumbs({ pathname }: { pathname: string }) {
  const trail = useMemo(() => findNavigationTrail(pathname), [pathname]);
  return (
    <nav aria-label="Breadcrumb" className="topbar-breadcrumbs">
      {trail.map((item, index) => (
        <span key={`${item}-${index}`} className="flex items-center gap-2">
          {index > 0 && <span className="text-text-muted text-xs">/</span>}
          <span
            className={cn(
              "truncate",
              index === trail.length - 1
                ? "text-text-primary font-bold"
                : "text-text-secondary"
            )}
          >
            {item}
          </span>
        </span>
      ))}
    </nav>
  );
}

function ThemeToggle() {
  const theme = useThemeStore((s) => s.theme);
  const toggleTheme = useThemeStore((s) => s.toggleTheme);
  return (
    <IconButton
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className="topbar-icon-btn"
    >
      {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
    </IconButton>
  );
}

function UserMenu({
  userEmail,
  onSignOut,
}: {
  userEmail?: string;
  onSignOut: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const initials =
    (userEmail ?? "U")
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        aria-expanded={open}
        className="topbar-user-btn"
      >
        <span
          className="text-primary-foreground flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {initials}
        </span>
        <span className="text-text-primary hidden max-w-28 truncate text-sm font-medium sm:block">
          {userEmail?.split("@")[0] ?? "Usuário"}
        </span>
        <ChevronDown
          size={16}
          className={cn(
            "text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </Button>
      {open && (
        <div className="border-border bg-surface text-text-primary shadow-elevated absolute top-11 right-0 z-50 w-56 rounded-[14px] border p-2">
          <div className="border-border border-b px-3 py-2">
            <div className="truncate text-sm font-bold">
              {userEmail ?? "Usuário"}
            </div>
            <div className="text-text-secondary text-xs">Sessão ativa</div>
          </div>
          <Button
            type="button"
            variant="ghost"
            onClick={onSignOut}
            className="mt-1 w-full justify-start px-3"
          >
            <LogOut size={16} />
            Sair
          </Button>
        </div>
      )}
    </div>
  );
}

function MobileNavDrawer({
  open,
  pathname,
  userEmail,
  onClose,
  onSignOut,
}: {
  open: boolean;
  pathname: string;
  userEmail?: string;
  onClose: () => void;
  onSignOut: () => void;
}) {
  const drawerRef = useRef<HTMLElement>(null);
  const closeAfterNavigation = useCallback(() => {
    window.setTimeout(onClose, 0);
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    window.setTimeout(() => drawerRef.current?.focus(), 0);
  }, [open]);

  if (!open) return null;

  const initials =
    (userEmail ?? "U")
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div
      className="fixed inset-0 z-50 lg:hidden"
      style={{ pointerEvents: "none" }}
    >
      <button
        type="button"
        aria-label="Fechar menu"
        className="sidebar-overlay"
        onClick={onClose}
        style={{ pointerEvents: "auto" }}
      />
      <aside
        ref={drawerRef}
        id="menu-mobile"
        className="sidebar-mobile-drawer"
        style={{ pointerEvents: "auto" }}
        tabIndex={-1}
        aria-modal="true"
      >
        <div className="mobile-drawer-header">
          <NavLink
            to="/app"
            onClick={closeAfterNavigation}
            onFocus={() => preloadRoute("/app")}
            onMouseEnter={() => preloadRoute("/app")}
            onPointerDown={() => preloadRoute("/app")}
            className="mobile-drawer-logo"
          >
            <AppLogo
              compact
              markClassName="[--logo-accent:var(--sidebar-foreground)]"
            />
          </NavLink>
          <IconButton
            onClick={onClose}
            aria-label="Fechar menu"
            className="size-10 rounded-xl bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)] [&_svg]:size-4"
          >
            <X size={20} />
          </IconButton>
        </div>
        <nav className="mobile-drawer-nav flex-1 overflow-y-auto px-3 py-3">
          {navigationItems.map((item) => {
            const active = isNavigationGroupActive(pathname, item);
            if (!item.items?.length && item.href) {
              const href = item.href;
              return (
                <NavLink
                  key={href}
                  to={href}
                  end
                  onClick={closeAfterNavigation}
                  onFocus={() => preloadRoute(href)}
                  onMouseEnter={() => preloadRoute(href)}
                  onPointerDown={() => preloadRoute(href)}
                  className={cn(
                    "sidebar-link",
                    active && "sidebar-link-active"
                  )}
                >
                  <item.icon size={20} />
                  <span>{item.title}</span>
                </NavLink>
              );
            }
            return (
              <div key={item.title}>
                <p className="sidebar-group-label">{item.title}</p>
                {item.items?.map((subitem) => {
                  const subActive = isNavigationActive(pathname, subitem.href);
                  const SubIcon = navigationIconMap[subitem.title];
                  return (
                    <NavLink
                      key={subitem.href}
                      to={subitem.href}
                      onClick={closeAfterNavigation}
                      onFocus={() => preloadRoute(subitem.href)}
                      onMouseEnter={() => preloadRoute(subitem.href)}
                      onPointerDown={() => preloadRoute(subitem.href)}
                      className={cn(
                        "sidebar-link",
                        subActive && "sidebar-link-active"
                      )}
                    >
                      {SubIcon && <SubIcon size={20} />}
                      <span>{subitem.title}</span>
                    </NavLink>
                  );
                })}
              </div>
            );
          })}
        </nav>
        <div className="sidebar-user">
          <div className="sidebar-user-avatar">{initials}</div>
          <div className="min-w-0 flex-1">
            <div className="sidebar-user-name truncate">
              {userEmail?.split("@")[0] ?? "Usuário"}
            </div>
            <div className="sidebar-user-role truncate">
              {userEmail ?? "Administrador"}
            </div>
          </div>
          <IconButton
            onClick={onSignOut}
            aria-label="Sair"
            className="size-10 rounded-lg bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
          >
            <LogOut size={16} />
          </IconButton>
        </div>
      </aside>
    </div>
  );
}

function MobileBottomNav({ pathname }: { pathname: string }) {
  const items: Array<{ title: string; href: string; icon: LucideIcon }> = [
    { title: "Início", href: "/app", icon: navigationIconMap.Dashboard! },
    { title: "Financeiro", href: "/app/financeiro/lancamentos", icon: navigationIconMap.Financeiro! },
    { title: "Fluxo", href: "/app/financeiro/fluxo-caixa", icon: navigationIconMap["Fluxo de Caixa"]! },
    { title: "Relatórios", href: "/app/relatorios", icon: navigationIconMap.Relatórios! },
  ];

  return (
    <nav className="mobile-bottom-nav" aria-label="Navegação principal mobile">
      {items.map((item) => {
        const active = isNavigationActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <NavLink
            key={item.href}
            to={item.href}
            onFocus={() => preloadRoute(item.href)}
            onMouseEnter={() => preloadRoute(item.href)}
            onPointerDown={() => preloadRoute(item.href)}
            className={cn("mobile-bottom-link", active && "mobile-bottom-link-active")}
            aria-current={active ? "page" : undefined}
            onPointerUp={(event) => {
              if (event.pointerType !== "mouse") event.currentTarget.blur();
            }}
          >
            <Icon size={18} />
            <span>{item.title}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

const sidebarStyles = `
.app-shell {
  --mobile-bottom-nav-offset: calc(64px + env(safe-area-inset-bottom));
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  background: var(--background);
  overflow-x: hidden;
}

.app-main {
  flex: 1;
  min-width: 0;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

#conteudo-principal {
  width: 100%;
  max-width: min(1680px, calc(100vw - 2rem));
  min-width: 0;
  margin-inline: auto;
  padding: clamp(18px, 2.6vw, 40px);
  flex: 1;
}

@media (max-width: 1023px) {
  .app-shell {
    display: block;
  }
  .app-main {
    padding: 0;
  }
  #conteudo-principal {
    padding: 24px;
    max-width: 100%;
  }
}

@media (max-width: 767px) {
  .app-main {
    height: 100dvh;
    min-height: 0;
    display: grid;
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }

  #conteudo-principal {
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior-y: contain;
    padding: 16px;
    scroll-margin-top: 64px;
  }
}

.sidebar {
  width: 272px;
  height: 100dvh;
  min-height: 0;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 24px 24px, color-mix(in srgb, var(--sidebar-active) 18%, transparent), transparent 150px),
    linear-gradient(180deg, color-mix(in srgb, var(--sidebar-foreground) 5%, transparent), transparent 180px),
    linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 58%, var(--sidebar-3) 100%);
  color: var(--sidebar-foreground);
  box-shadow: none;
  position: sticky;
  top: 0;
  flex-shrink: 0;
  border-right: 1px solid var(--sidebar-border);
  overflow: hidden;
}

@media (max-width: 1023px) {
  .sidebar {
    display: none;
  }
}

.sidebar-logo {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 14px;
  padding: 8px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--sidebar-foreground) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 10%, transparent);
}

.app-logo {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 12px;
  color: var(--sidebar-foreground);
  text-decoration: none;
}

.app-logo-mark {
  width: 40px;
  height: 40px;
  flex: 0 0 auto;
  color: var(--primary);
  --logo-accent: var(--sidebar-foreground);
}

.app-logo-copy {
  display: grid;
  gap: 2px;
  line-height: 1.1;
}

.app-logo-copy strong {
  color: var(--sidebar-foreground);
  font-size: 17px;
  font-weight: 800;
}

.app-logo-copy span {
  color: var(--sidebar-muted);
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
  padding: 2px 2px 2px 0;
}

.sidebar-nav > div {
  min-width: 0;
  padding: 6px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--sidebar-foreground) 3%, transparent);
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 6%, transparent);
}

.sidebar-group-label {
  margin: 2px 0 8px 8px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--sidebar-muted);
}

.sidebar-link {
  position: relative;
  width: 100%;
  min-width: 0;
  min-height: 42px;
  padding: 0 10px;
  border-radius: 12px;
  border: 1px solid transparent;
  display: inline-flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
  color: var(--sidebar-foreground);
  text-decoration: none;
  font-size: 14px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
  transition: background-color 150ms ease, color 150ms ease, border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

.sidebar-link span {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
}

.sidebar-link:hover {
  background: color-mix(in srgb, var(--sidebar-foreground) 8%, transparent);
  color: var(--sidebar-active-foreground);
  transform: translateX(1px);
}

.sidebar-link-active {
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--sidebar-active) 38%, transparent), color-mix(in srgb, var(--sidebar-active) 20%, transparent)),
    color-mix(in srgb, var(--sidebar-foreground) 5%, transparent);
  color: var(--sidebar-active-foreground);
  border-color: color-mix(in srgb, var(--sidebar-active) 46%, transparent);
  box-shadow:
    inset 0 1px 0 color-mix(in srgb, var(--sidebar-foreground) 16%, transparent),
    0 10px 24px color-mix(in srgb, var(--sidebar-active) 16%, transparent);
}

.sidebar-link-active::before {
  content: "";
  position: absolute;
  left: 4px;
  top: 50%;
  width: 3px;
  height: 18px;
  border-radius: 999px;
  background: var(--sidebar-active);
  transform: translateY(-50%);
}

.sidebar-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-user {
  flex: 0 0 auto;
  margin-top: 12px;
  padding: 10px;
  border-radius: 16px;
  background:
    linear-gradient(135deg, color-mix(in srgb, var(--sidebar-foreground) 8%, transparent), color-mix(in srgb, var(--sidebar-active) 8%, transparent));
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 12%, transparent);
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-user-avatar {
  width: 38px;
  height: 38px;
  border-radius: 13px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--sidebar-active), color-mix(in srgb, var(--primary) 72%, var(--sidebar-foreground)));
  color: var(--primary-foreground);
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--sidebar-foreground);
}

.sidebar-user-role {
  font-size: 12px;
  font-weight: 500;
  color: var(--sidebar-muted);
}

.topbar {
  position: relative;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 64px;
  padding: 0 32px;
  border-bottom: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface) 82%, transparent);
  backdrop-filter: blur(14px) saturate(1.08);
  flex: 0 0 auto;
}

.mobile-page-title {
  display: none;
  min-width: 0;
  flex: 1 1 auto;
  color: var(--text-strong);
  font-size: 15px;
  font-weight: 800;
  line-height: 1.15;
}

.mobile-page-title span {
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

@media (max-width: 1023px) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    padding: 0 24px;
    min-height: 60px;
  }
}

@media (max-width: 767px) {
  .topbar {
    min-height: 56px;
    padding: 0 16px;
    gap: 10px;
  }

  .mobile-page-title {
    display: block;
  }
}

.mobile-menu-button {
  display: none;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  line-height: 1;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
  color: var(--foreground);
  transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.mobile-menu-button svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.mobile-menu-button:hover {
  background: var(--surface-2);
  border-color: var(--primary);
}

@media (max-width: 1023px) {
  .mobile-menu-button {
    display: inline-flex;
  }
}

.topbar-breadcrumbs {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

@media (max-width: 767px) {
  .topbar-breadcrumbs {
    display: none;
  }
}

.topbar-actions {
  flex: 0 0 auto;
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

@media (max-width: 767px) {
  .topbar-actions {
    gap: 6px;
  }

  .topbar-icon-btn,
  .mobile-menu-button {
    width: 40px;
    height: 40px;
  }

  .topbar-user-btn {
    width: 40px;
    height: 40px;
    padding: 0;
  }

  .topbar-user-btn > span:not(:first-child),
  .topbar-user-btn > svg {
    display: none;
  }
}

.topbar-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
  color: var(--foreground);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  transition: background-color 150ms ease, border-color 150ms ease, transform 150ms ease;
}

.topbar-icon-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.topbar-icon-btn:hover {
  background: var(--surface-2);
  border-color: var(--primary);
}

.topbar-user-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--border-subtle);
  background: color-mix(in srgb, var(--surface) 92%, var(--surface-2));
  line-height: 1;
  transition: background-color 150ms ease, border-color 150ms ease;
}

.topbar-user-btn svg {
  width: 16px;
  height: 16px;
  flex-shrink: 0;
}

.topbar-user-btn:hover {
  background: var(--surface-2);
  border-color: var(--primary);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 10, 20, 0.52);
  backdrop-filter: blur(10px);
  z-index: 50;
}

.sidebar-mobile-drawer {
  position: relative;
  width: min(372px, calc(100vw - 24px));
  max-width: calc(100vw - 24px);
  height: calc(100dvh - 16px);
  margin: 8px 0 8px 8px;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at 36px 40px, color-mix(in srgb, var(--sidebar-active) 20%, transparent), transparent 160px),
    linear-gradient(180deg, color-mix(in srgb, var(--sidebar-foreground) 5%, transparent), transparent 150px),
    linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 54%, var(--sidebar-3) 100%);
  color: var(--sidebar-foreground);
  z-index: 60;
  border: 1px solid var(--sidebar-border);
  border-radius: 20px;
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.32);
  animation: slideIn 180ms ease;
  outline: none;
}

.mobile-drawer-header {
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  margin: 8px 8px 4px;
  padding: 10px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--sidebar-foreground) 5%, transparent);
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 10%, transparent);
}

.mobile-drawer-logo {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--sidebar-foreground);
  text-decoration: none;
}

.sidebar-mobile-drawer nav {
  min-height: 0;
  overflow-x: hidden;
}

.mobile-drawer-nav {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mobile-drawer-nav > div {
  padding: 8px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--sidebar-foreground) 4%, transparent);
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 7%, transparent);
}

.mobile-drawer-nav .sidebar-group-label {
  margin-top: 4px;
}

.mobile-drawer-nav .sidebar-link {
  min-height: 46px;
  margin-top: 4px;
  padding-inline: 12px;
}

.sidebar-mobile-drawer .sidebar-user {
  margin: 8px;
  border-radius: 16px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
}

.mobile-bottom-nav {
  display: none;
}

@media (max-width: 767px) {
  .mobile-bottom-nav {
    position: relative;
    right: auto;
    bottom: auto;
    left: auto;
    z-index: 45;
    display: grid;
    grid-template-columns: repeat(4, minmax(0, 1fr));
    gap: 4px;
    min-height: 60px;
    border-top: 1px solid color-mix(in srgb, var(--border) 82%, transparent);
    background: color-mix(in srgb, var(--surface) 94%, transparent);
    box-shadow: 0 -8px 22px rgba(3, 10, 24, 0.06);
    backdrop-filter: blur(14px) saturate(1.08);
    margin: 0;
    padding: 4px 10px calc(4px + env(safe-area-inset-bottom));
  }

  .mobile-bottom-link {
    min-width: 0;
    min-height: 52px;
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 5px;
    border-radius: 12px;
    color: var(--text-muted);
    background: transparent;
    border: 0;
    padding: 0;
    font-size: 11.5px;
    font-weight: 750;
    line-height: 1;
    text-decoration: none;
    transition: background-color 150ms ease, color 150ms ease, transform 150ms ease, box-shadow 150ms ease;
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  .mobile-bottom-link:focus:not(:focus-visible) {
    outline: none;
    box-shadow: none;
  }

  .mobile-bottom-link:focus-visible {
    outline: 2px solid var(--primary);
    outline-offset: 2px;
  }

  @media (hover: none) and (pointer: coarse) {
    .mobile-bottom-link:focus-visible {
      outline: none;
    }
  }

  .mobile-bottom-link svg {
    width: 22px;
    height: 22px;
    flex-shrink: 0;
  }

  .mobile-bottom-link span {
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mobile-bottom-link-active {
    background: color-mix(in srgb, var(--primary) 10%, transparent);
    color: var(--primary);
    box-shadow: inset 0 2px 0 var(--primary);
  }

  .mobile-bottom-link:active {
    transform: translateY(1px);
  }
}

@media (max-width: 380px) {
  .app-shell {
    --mobile-bottom-nav-offset: calc(62px + env(safe-area-inset-bottom));
  }

  .mobile-bottom-nav {
    min-height: 58px;
    padding-inline: 6px;
  }

  .mobile-bottom-link {
    min-height: 50px;
    gap: 4px;
    border-radius: 11px;
    font-size: 9.75px;
  }

  .mobile-bottom-link svg {
    width: 20px;
    height: 20px;
  }
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}

/* Collapsed sidebar */
.sidebar-collapsed .sidebar {
  width: 80px;
  padding: 18px 8px;
  transition: padding 180ms ease;
}

.sidebar-collapsed .sidebar-logo {
  flex-direction: column;
  gap: 12px;
  padding: 8px 4px;
  margin-bottom: 12px;
  justify-content: center;
}

.sidebar-logo-link {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  color: var(--sidebar-foreground);
  text-decoration: none;
}

.sidebar-collapsed .sidebar-group-label {
  display: none;
}

.sidebar-collapsed .sidebar-link {
  justify-content: center;
  padding: 0;
  width: 44px;
  min-height: 44px;
  margin-inline: auto;
}

.sidebar-collapsed .sidebar-link span {
  display: none;
}

.sidebar-collapsed .sidebar-nav {
  align-items: center;
}

.sidebar-collapsed .sidebar-nav > div {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 6px;
}

.sidebar-collapse-btn {
  width: 40px;
  height: 40px;
  border-radius: 12px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  color: var(--sidebar-foreground);
  background: color-mix(in srgb, var(--sidebar-foreground) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--sidebar-foreground) 12%, transparent);
  cursor: pointer;
  box-shadow: none;
  transition: background-color 150ms ease, border-color 150ms ease, color 150ms ease, transform 150ms ease;
}

.sidebar-collapse-btn:hover {
  background: color-mix(in srgb, var(--sidebar-foreground) 13%, transparent);
  border-color: color-mix(in srgb, var(--sidebar-foreground) 24%, transparent);
  color: var(--sidebar-foreground);
  transform: translateY(-1px);
}

.sidebar-collapse-btn:focus-visible {
  outline: 2px solid color-mix(in srgb, var(--sidebar-active) 76%, transparent);
  outline-offset: 2px;
}

.sidebar-collapsed .sidebar-link-active::before {
  left: 4px;
  height: 18px;
}

.sidebar-collapsed .sidebar-collapse-btn {
  width: 44px;
  height: 40px;
}

.sidebar-collapsed .sidebar-user {
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  align-items: center;
}

.sidebar-collapsed .sidebar-user .min-w-0 {
  display: none;
}

`;
