import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ChevronDown, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { AppLogo } from "@/components/brand/AppLogo";
import { useAuthStore } from "@/lib/supabase/auth-store";
import { cn } from "@/lib/utils";
import { useThemeStore } from "@/stores/theme";
import {
  findNavigationTrail,
  isNavigationActive,
  isNavigationGroupActive,
  navigationIconMap,
  navigationItems,
  type NavigationItem,
} from "./navigation";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  async function handleSignOut() {
    await signOut();
    navigate("/");
  }

  return (
    <div className="app-shell">
      <a
        href="#conteudo-principal"
        className="focus:bg-surface focus:text-primary focus:shadow-card focus:ring-primary/28 sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:rounded-[14px] focus:px-4 focus:py-2 focus:text-sm focus:font-bold focus:ring-[3px] focus:outline-none"
      >
        Pular para o conteúdo
      </a>
      <AppSidebar
        pathname={location.pathname}
        userEmail={user?.email}
        onSignOut={handleSignOut}
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
  pathname,
  userEmail,
  onSignOut,
}: {
  pathname: string;
  userEmail?: string;
  onSignOut: () => void;
}) {
  return (
    <>
      <aside className="sidebar" aria-label="Menu principal">
        <div className="sidebar-logo">
          <NavLink
            to="/app"
            aria-label="Ir para Dashboard"
            className="flex flex-col items-center gap-2"
          >
            <AppLogo />
          </NavLink>
        </div>

        <nav className="sidebar-nav">
          {navigationItems.map((item) => (
            <SidebarGroup key={item.title} item={item} pathname={pathname} />
          ))}
        </nav>

        <SidebarFooter userEmail={userEmail} onSignOut={onSignOut} />
      </aside>
      <style>{sidebarStyles}</style>
    </>
  );
}

function SidebarGroup({
  item,
  pathname,
}: {
  item: NavigationItem;
  pathname: string;
}) {
  const active = isNavigationGroupActive(pathname, item);
  const Icon = item.icon;

  if (!item.items?.length && item.href) {
    return (
      <div>
        <NavLink
          to={item.href}
          end={item.href === "/app"}
          className={cn("sidebar-link", active && "sidebar-link-active")}
          aria-current={active ? "page" : undefined}
        >
          <Icon size={20} />
          <span>{item.title}</span>
        </NavLink>
      </div>
    );
  }

  return (
    <div>
      <p className="sidebar-group-label">{item.title}</p>
      {item.items?.map((subitem) => {
        const subActive = isNavigationActive(pathname, subitem.href);
        const SubIcon = navigationIconMap[subitem.title];
        return (
          <NavLink
            key={subitem.href}
            to={subitem.href}
            className={cn("sidebar-link", subActive && "sidebar-link-active")}
            aria-current={subActive ? "page" : undefined}
          >
            {SubIcon && <SubIcon size={20} />}
            <span>{subitem.title}</span>
          </NavLink>
        );
      })}
    </div>
  );
}

function SidebarFooter({
  userEmail,
  onSignOut,
}: {
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
      <button
        type="button"
        onClick={onSignOut}
        aria-label="Sair"
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
      >
        <LogOut size={16} />
      </button>
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
  return (
    <header className="topbar">
      <button
        type="button"
        onClick={onOpenMobile}
        className="mobile-menu-button"
        aria-label="Abrir menu"
        aria-expanded={mobileOpen}
        aria-controls="menu-mobile"
      >
        <Menu size={20} />
      </button>
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
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Ativar modo claro" : "Ativar modo escuro"}
      className="topbar-icon-btn"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
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
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Menu do usuário"
        aria-expanded={open}
        className="topbar-user-btn"
      >
        <span
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground"
          style={{ backgroundColor: "var(--primary)" }}
        >
          {initials}
        </span>
        <span className="text-text-primary hidden max-w-28 truncate text-sm font-medium sm:block">
          {userEmail?.split("@")[0] ?? "Usuário"}
        </span>
        <ChevronDown
          size={14}
          className={cn(
            "text-text-muted transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      {open && (
        <div className="border-border bg-surface text-text-primary shadow-elevated absolute top-11 right-0 z-50 w-56 rounded-[14px] border p-2">
          <div className="border-border border-b px-3 py-2">
            <div className="truncate text-sm font-bold">
              {userEmail ?? "Usuário"}
            </div>
            <div className="text-text-secondary text-xs">Sessão ativa</div>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            className="text-text-secondary hover:bg-surface-soft hover:text-text-primary mt-1 flex w-full items-center gap-2 rounded-[10px] px-3 py-2 text-sm font-medium transition"
          >
            <LogOut size={16} />
            Sair
          </button>
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
  useEffect(() => {
    if (!open) return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const initials =
    (userEmail ?? "U")
      .split(/[\s@._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p) => p[0]?.toUpperCase())
      .join("") || "U";

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <button
        type="button"
        aria-label="Fechar menu"
        className="sidebar-overlay"
        onClick={onClose}
      />
      <aside id="menu-mobile" className="sidebar-mobile-drawer">
        <div className="flex items-center justify-between px-4 py-5">
          <NavLink
            to="/app"
            onClick={onClose}
            className="flex items-center gap-3"
          >
            <AppLogo markClassName="[--logo-accent:var(--sidebar-foreground)]" />
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex size-10 items-center justify-center rounded-xl bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
          >
            <X size={20} />
          </button>
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {navigationItems.map((item) => {
            const active = isNavigationGroupActive(pathname, item);
            if (!item.items?.length && item.href) {
              return (
                <NavLink
                  key={item.href}
                  to={item.href}
                  end
                  onClick={onClose}
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
                      onClick={onClose}
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
          <button
            type="button"
            onClick={onSignOut}
            aria-label="Sair"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--sidebar-foreground)_10%,transparent)] text-[var(--sidebar-muted)] transition hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-foreground)]"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>
    </div>
  );
}

const sidebarStyles = `
.app-shell {
  min-height: 100vh;
  display: flex;
  background: var(--background);
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

#conteudo-principal {
  width: 100%;
  max-width: 1360px;
  margin-inline: auto;
  padding: 32px;
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
  #conteudo-principal {
    padding: 16px;
  }
}

.sidebar {
  width: 272px;
  min-height: 100vh;
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 54%, var(--sidebar-3) 100%);
  color: var(--sidebar-foreground);
  box-shadow: var(--shadow-lg);
  position: sticky;
  top: 0;
  flex-shrink: 0;
  border-right: 1px solid var(--sidebar-border);
}

@media (max-width: 1023px) {
  .sidebar {
    display: none;
  }
}

.sidebar-logo {
  display: flex;
  align-items: center;
  padding: 4px 4px 24px;
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
  width: 44px;
  height: 44px;
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
  font-size: 18px;
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
  gap: 24px;
  flex: 1;
  overflow-y: auto;
}

.sidebar-group-label {
  margin: 0 0 8px 12px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: var(--sidebar-muted);
}

.sidebar-link {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--sidebar-foreground);
  text-decoration: none;
  font-size: 14px;
  font-weight: 650;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.sidebar-link:hover {
  background: var(--sidebar-hover);
  color: var(--sidebar-active-foreground);
  transform: translateX(2px);
}

.sidebar-link-active {
  background: var(--sidebar-active);
  color: var(--sidebar-active-foreground);
  box-shadow: 0 14px 30px var(--primary-ring);
}

.sidebar-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-user {
  margin-top: auto;
  padding: 12px;
  border-radius: var(--radius-lg);
  background: color-mix(in srgb, var(--sidebar-foreground) 8%, transparent);
  border: 1px solid var(--sidebar-border);
  display: flex;
  align-items: center;
  gap: 10px;
}

.sidebar-user-avatar {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: grid;
  place-items: center;
  background: var(--primary);
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
  background: color-mix(in srgb, var(--background) 84%, transparent);
  backdrop-filter: blur(16px);
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
  }
}

.mobile-menu-button {
  display: none;
  width: 44px;
  height: 44px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--foreground);
  transition: background-color 180ms ease, border-color 180ms ease, transform 180ms ease;
}

.mobile-menu-button:hover {
  background: var(--surface-2);
  border-color: var(--primary);
  transform: translateY(-1px);
}

@media (max-width: 1023px) {
  .mobile-menu-button {
    display: inline-flex;
  }
}

.topbar-breadcrumbs {
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
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 8px;
}

.topbar-icon-btn {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  color: var(--foreground);
  display: grid;
  place-items: center;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.topbar-icon-btn:hover {
  background: var(--surface-2);
  border-color: var(--primary);
  transform: translateY(-1px);
}

.topbar-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  border-radius: 12px;
  border: 1px solid var(--border);
  background: var(--surface);
  transition: background-color 160ms ease, border-color 160ms ease;
}

.topbar-user-btn:hover {
  background: var(--surface-2);
  border-color: var(--primary);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(5, 11, 20, 0.62);
  backdrop-filter: blur(4px);
  z-index: 50;
}

.sidebar-mobile-drawer {
  position: relative;
  width: 320px;
  max-width: 88vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background: linear-gradient(180deg, var(--sidebar) 0%, var(--sidebar-2) 50%, var(--sidebar-3) 100%);
  color: var(--sidebar-foreground);
  z-index: 60;
  animation: slideIn 220ms ease;
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
`;
