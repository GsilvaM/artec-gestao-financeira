import { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";
import { ChevronDown, LogOut, Menu, Moon, Sun, X } from "lucide-react";
import { ArtecLogoMark } from "@/components/brand/ArtecLogoMark";
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
            <ArtecLogoMark className="sidebar-logo-mark" />
            <span className="sidebar-logo-text">Artec Gestão</span>
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
        className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
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

  const palette = ["#185FA5", "#1D9E75", "#D85A30", "#7C3AED", "#BA7517"];
  const hash = Array.from(userEmail ?? "U").reduce(
    (acc, char) => acc + char.charCodeAt(0),
    0
  );

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
          className="flex size-7 shrink-0 items-center justify-center rounded-full text-[11px] font-bold text-white"
          style={{ backgroundColor: palette[hash % palette.length] }}
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
            <ArtecLogoMark className="size-11 [--logo-accent:#bfd9ff]" />
            <span className="text-lg font-bold text-white">Artec Gestão</span>
          </NavLink>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar menu"
            className="flex size-10 items-center justify-center rounded-xl bg-white/10 text-white/70 hover:bg-white/20 hover:text-white"
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
            className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/70 transition hover:bg-white/20 hover:text-white"
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
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.08), transparent 360px),
    radial-gradient(circle at top right, rgba(18, 183, 106, 0.04), transparent 340px),
    linear-gradient(180deg, var(--color-background) 0%, var(--color-background-soft) 100%);
}

.app-main {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

#conteudo-principal {
  width: 100%;
  max-width: 1480px;
  margin-inline: auto;
  padding: 32px clamp(20px, 2vw, 32px) 32px;
  flex: 1;
}

@media (max-width: 767px) {
  .app-shell {
    display: block;
  }
  .app-main {
    padding: 0;
  }
  #conteudo-principal {
    padding: 12px 12px 32px;
    max-width: 100%;
  }
}

.sidebar {
  width: 216px;
  min-height: 100vh;
  padding: 18px 12px;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.12), transparent 260px),
    linear-gradient(180deg, #03152e 0%, #06244a 45%, #073b78 100%);
  color: #ffffff;
  box-shadow: 18px 0 46px rgba(6, 26, 56, 0.2);
  position: sticky;
  top: 0;
  flex-shrink: 0;
  border-radius: 0 28px 28px 0;
}

@media (max-width: 767px) {
  .sidebar {
    display: none;
  }
}

.sidebar-logo {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
  padding: 12px 0 28px;
}

.sidebar-logo-mark {
  width: 66px;
  height: 66px;
  color: #ffffff;
  --logo-accent: #bfd9ff;
  filter: drop-shadow(0 12px 22px rgba(0, 0, 0, 0.18));
}

.sidebar-logo-text {
  font-size: 16px;
  font-weight: 800;
  color: #ffffff;
  letter-spacing: -0.035em;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 20px;
  flex: 1;
  overflow-y: auto;
}

.sidebar-group-label {
  margin: 0 0 8px 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.5);
}

.sidebar-link {
  min-height: 48px;
  padding: 0 12px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  gap: 12px;
  color: rgba(255, 255, 255, 0.84);
  text-decoration: none;
  font-size: 13px;
  font-weight: 700;
  transition: background-color 180ms ease, color 180ms ease, transform 180ms ease, box-shadow 180ms ease;
}

.sidebar-link:hover {
  background: rgba(255, 255, 255, 0.09);
  color: #ffffff;
  transform: translateX(2px);
}

.sidebar-link-active {
  background: linear-gradient(135deg, #155eef 0%, #2563eb 100%);
  color: #ffffff;
  box-shadow: 0 12px 26px rgba(21, 94, 239, 0.3);
}

.sidebar-link svg {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

.sidebar-user {
  margin-top: auto;
  padding: 12px;
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.14);
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
  background: linear-gradient(135deg, #2dd4bf, #2563eb);
  color: #ffffff;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.sidebar-user-name {
  font-size: 13px;
  font-weight: 700;
  color: #ffffff;
}

.sidebar-user-role {
  font-size: 12px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.68);
}

.topbar {
  position: relative;
  z-index: 30;
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 58px;
  padding: 0 clamp(20px, 2vw, 32px);
}

@media (max-width: 767px) {
  .topbar {
    position: sticky;
    top: 0;
    z-index: 30;
    background: color-mix(in srgb, var(--color-surface) 88%, transparent);
    border-bottom: 1px solid var(--color-border);
    backdrop-filter: blur(12px);
    padding: 0 12px;
    min-height: 52px;
  }
}

.mobile-menu-button {
  display: none;
}

@media (max-width: 767px) {
  .mobile-menu-button {
    display: inline-flex;
    width: 42px;
    height: 42px;
    align-items: center;
    justify-content: center;
    border-radius: 14px;
    border: 1px solid var(--color-border);
    background: var(--color-surface);
    color: var(--color-text-primary);
    transition: background-color 160ms ease, border-color 160ms ease;
  }
  .mobile-menu-button:hover {
    background: var(--color-surface-muted);
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
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 86%, transparent);
  color: var(--color-text-primary);
  display: grid;
  place-items: center;
  transition: background-color 160ms ease, border-color 160ms ease, transform 160ms ease;
}

.topbar-icon-btn:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
  transform: translateY(-1px);
}

.topbar-user-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  height: 44px;
  padding: 0 12px;
  border-radius: 16px;
  border: 1px solid var(--color-border);
  background: color-mix(in srgb, var(--color-surface) 86%, transparent);
  transition: background-color 160ms ease, border-color 160ms ease;
}

.topbar-user-btn:hover {
  background: var(--color-surface-muted);
  border-color: var(--color-border-strong);
}

.sidebar-overlay {
  position: fixed;
  inset: 0;
  background: rgba(3, 10, 24, 0.56);
  backdrop-filter: blur(4px);
  z-index: 50;
}

.sidebar-mobile-drawer {
  position: relative;
  width: 300px;
  max-width: 88vw;
  height: 100%;
  display: flex;
  flex-direction: column;
  background:
    radial-gradient(circle at top, rgba(255, 255, 255, 0.10), transparent 260px),
    linear-gradient(180deg, var(--sidebar-start) 0%, var(--sidebar-mid) 48%, var(--sidebar-end) 100%);
  color: #ffffff;
  z-index: 60;
  animation: slideIn 220ms ease;
}

@keyframes slideIn {
  from { transform: translateX(-100%); }
  to { transform: translateX(0); }
}
`;
