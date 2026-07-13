import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react";
import {
  Children,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Button } from "@/components/ui/button";
import { FloatingActionButton } from "@/components/ui/floating-action-button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="page-header">
      <div>
        <h1 className="page-header-title">{title}</h1>
        {description && <p className="page-header-desc">{description}</p>}
      </div>
      {actions && <div className="page-header-actions">{actions}</div>}
    </header>
  );
}

export const pageHeaderStyles = `
.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 768px) {
  .page-header-actions {
    width: 100%;
  }
  .page-header-actions > * {
    flex: 1;
  }
}
`;

interface MetricCardProps {
  title: string;
  value: string;
  icon: LucideIcon;
  tone?: "blue" | "green" | "red" | "amber" | "slate";
  helper?: string;
  className?: string;
  valueClassName?: string;
}

const toneStyles: Record<string, string> = {
  blue: "bg-primary-50 text-primary-600 border-primary-100",
  green: "bg-success-50 text-success-600 border-success-100",
  red: "bg-danger-50 text-danger-600 border-danger-100",
  amber: "bg-warning-50 text-warning-600 border-warning-100",
  slate: "bg-surface-soft text-text-secondary border-border-soft",
};

export function MetricCard({
  title,
  value,
  icon: Icon,
  tone = "blue",
  helper,
  className,
  valueClassName,
}: MetricCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="stat-card-header">
        <span className="stat-label">{title}</span>
        <span className={cn("stat-icon-wrap", toneStyles[tone])}>
          <Icon size={18} />
        </span>
      </div>
      <strong className={cn("stat-value", valueClassName)}>{value}</strong>
      {helper && <span className="stat-description">{helper}</span>}
    </div>
  );
}

export function MoneyValue({
  value,
  tone = "neutral",
}: {
  value: string;
  tone?: "neutral" | "positive" | "negative";
}) {
  const color =
    tone === "positive"
      ? "text-success"
      : tone === "negative"
        ? "text-destructive"
        : "text-foreground";
  return <span className={cn("font-bold tabular-nums", color)}>{value}</span>;
}

const statusStyles: Record<string, string> = {
  aberto: "bg-primary-50 text-primary-600 border-primary-100",
  pending: "bg-warning-50 text-warning-600 border-warning-100",
  approved: "bg-success-50 text-success-600 border-success-100",
  rejected: "bg-danger-50 text-danger-600 border-danger-100",
  disabled: "bg-surface-soft text-text-secondary border-border-soft",
  pago: "bg-success-50 text-success-600 border-success-100",
  confirmed: "bg-success-50 text-success-600 border-success-100",
  paid: "bg-success-50 text-success-600 border-success-100",
  received: "bg-success-50 text-success-600 border-success-100",
  vencido: "bg-danger-50 text-danger-600 border-danger-100",
  overdue: "bg-danger-50 text-danger-600 border-danger-100",
  cancelled: "bg-surface-soft text-text-muted border-border-soft",
  reversed: "bg-danger-50 text-danger-600 border-danger-100",
  rascunho: "bg-warning-50 text-warning-600 border-warning-100",
  ativo: "bg-primary-50 text-primary-600 border-primary-100",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  pending: "Pendente",
  approved: "Aprovado",
  rejected: "Rejeitado",
  disabled: "Desativado",
  pago: "Pago",
  confirmed: "Confirmado",
  paid: "Pago",
  received: "Recebido",
  vencido: "Vencido",
  overdue: "Vencido",
  cancelled: "Cancelado",
  reversed: "Estornado",
  rascunho: "Rascunho",
  ativo: "Ativo",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span
      className={cn(
        "badge",
        statusStyles[status] ??
          "bg-surface-soft text-text-secondary border-border-soft"
      )}
    >
      {statusLabels[status] ?? status}
    </span>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="stat-card">
          <div className="space-y-4">
            <Skeleton className="h-3 w-24 rounded-full" />
            <Skeleton className="h-8 w-36 rounded-full" />
            <Skeleton className="h-3 w-44 rounded-full" />
            <div className="text-text-muted flex items-center gap-2 text-xs">
              <Loader2 className="size-3 animate-spin" />
              {label}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

interface FilterBarProps {
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  activeFilters?: { key: string; label: string; onRemove: () => void }[];
  filters?: FilterBarFilter[];
  resultCount?: number;
  children?: ReactNode;
}

interface FilterBarFilter {
  key: string;
  label: string;
  control: ReactNode;
  primary?: boolean;
}

export function FilterBar({
  searchPlaceholder = "Buscar...",
  search,
  onSearchChange,
  activeFilters = [],
  filters,
  resultCount,
  children,
}: FilterBarProps) {
  const [desktopOpen, setDesktopOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);
  const desktopButtonRef = useRef<HTMLButtonElement>(null);
  const mobileButtonRef = useRef<HTMLButtonElement>(null);
  const mobileDialogRef = useRef<HTMLDialogElement>(null);
  const generatedFilters = useMemo<FilterBarFilter[]>(() => {
    if (filters) return filters;
    return Children.toArray(children).map((child, index) => ({
      key: `filter-${index}`,
      label: `Filtro ${index + 1}`,
      control: child,
    }));
  }, [children, filters]);
  const primaryFilters = generatedFilters.filter((filter) => filter.primary).slice(0, 2);
  const advancedFilters = generatedFilters.filter((filter) => !filter.primary);
  const hasFilters = generatedFilters.length > 0;
  const hasActiveFilters = activeFilters.length > 0;
  const advancedActiveCount = activeFilters.filter(
    (filter) => !primaryFilters.some((primary) => primary.key === filter.key),
  ).length;
  const applyLabel =
    typeof resultCount === "number" ? `Aplicar (${resultCount})` : "Aplicar";

  useEffect(() => {
    if (!desktopOpen) return;
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (popoverRef.current?.contains(target)) return;
      if (desktopButtonRef.current?.contains(target)) return;
      setDesktopOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setDesktopOpen(false);
    }
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [desktopOpen]);

  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;
    if (mobileOpen && !dialog.open) {
      dialog.showModal();
      window.setTimeout(() => {
        dialog
          .querySelector<HTMLElement>(".filter-sheet-body select, .filter-sheet-body input, .filter-sheet-body button")
          ?.focus();
      }, 40);
    }
    if (!mobileOpen && dialog.open) dialog.close();
  }, [mobileOpen]);

  useEffect(() => {
    const dialog = mobileDialogRef.current;
    if (!dialog) return;
    const close = () => {
      setMobileOpen(false);
      window.setTimeout(() => mobileButtonRef.current?.focus(), 0);
    };
    dialog.addEventListener("close", close);
    return () => dialog.removeEventListener("close", close);
  }, []);

  function clearAllFilters() {
    activeFilters.forEach((filter) => filter.onRemove());
  }

  function openFilterPanel(filterKey?: string) {
    if (
      typeof window !== "undefined" &&
      typeof window.matchMedia === "function" &&
      window.matchMedia("(max-width: 768px)").matches
    ) {
      setMobileOpen(true);
    } else {
      setDesktopOpen(true);
    }

    if (!filterKey) return;
    window.setTimeout(() => {
      const target = document.querySelector<HTMLElement>(
        `[data-filter-panel-key="${filterKey}"] select, [data-filter-panel-key="${filterKey}"] input, [data-filter-panel-key="${filterKey}"] button`,
      );
      target?.focus();
      target?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 80);
  }

  return (
    <>
      <div className="filter-card">
        <div className="filter-row">
          <div className="relative min-w-[180px] flex-1">
            <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              className="search-input"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          <div className="filter-primary-slot">
            {primaryFilters.map((filter) => (
              <div key={filter.key} className="filter-primary-control">
                {filter.control}
              </div>
            ))}
          </div>
          {hasFilters && (
            <Button
              ref={desktopButtonRef}
              type="button"
              variant="outline"
              size="default"
              className={cn("filter-toggle filter-toggle-desktop", advancedActiveCount && "filter-toggle-active")}
              onClick={() => setDesktopOpen((v) => !v)}
              aria-expanded={desktopOpen}
              aria-controls="filter-popover"
            >
              <SlidersHorizontal size={16} />
              Mais filtros{advancedActiveCount ? ` (${advancedActiveCount})` : ""}
              <ChevronDown
                size={14}
                className={cn("transition-transform", desktopOpen && "rotate-180")}
              />
            </Button>
          )}
          {hasFilters && (
            <Button
              ref={mobileButtonRef}
              type="button"
              variant="outline"
              size="icon"
              className={cn("filter-toggle filter-toggle-mobile", hasActiveFilters && "filter-toggle-active")}
              onClick={() => setMobileOpen(true)}
              aria-label={`Abrir filtros${hasActiveFilters ? `, ${activeFilters.length} ativos` : ""}`}
              aria-expanded={mobileOpen}
            >
              <SlidersHorizontal size={16} />
              {hasActiveFilters ? (
                <span className="filter-count-badge">{activeFilters.length}</span>
              ) : null}
            </Button>
          )}
        </div>
        {hasActiveFilters && (
          <div className="active-filter-row" aria-label="Filtros ativos">
            {activeFilters.map((filter) => (
              <span
                key={filter.key}
                className="active-filter-chip"
                title={filter.label}
              >
                <button
                  type="button"
                  className="active-filter-chip-label"
                  onClick={() => openFilterPanel(filter.key)}
                  aria-label={`Editar filtro ${filter.label}`}
                  title={filter.label}
                >
                  {filter.label}
                </button>
                <button
                  type="button"
                  className="active-filter-chip-remove"
                  onClick={filter.onRemove}
                  aria-label={`Remover filtro ${filter.label}`}
                >
                  <X className="size-3.5" />
                </button>
              </span>
            ))}
            {activeFilters.length > 1 ? (
              <button type="button" className="active-filter-clear" onClick={clearAllFilters}>
                Limpar tudo
              </button>
            ) : null}
          </div>
        )}
        {hasFilters && desktopOpen ? (
          <div
            id="filter-popover"
            className="filter-popover"
            ref={popoverRef}
            role="dialog"
            aria-label="Mais filtros"
          >
            <div className="filter-panel-grid">
              {(advancedFilters.length ? advancedFilters : generatedFilters).map((filter) => (
                <label key={filter.key} className="filter-panel-field" data-filter-panel-key={filter.key}>
                  <span>{filter.label}</span>
                  {filter.control}
                </label>
              ))}
            </div>
            <div className="filter-panel-footer">
              <Button type="button" variant="ghost" size="sm" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                Limpar
              </Button>
              <Button type="button" size="sm" onClick={() => setDesktopOpen(false)}>
                {applyLabel}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      {hasFilters && mobileOpen ? (
        <dialog
          ref={mobileDialogRef}
          className="filter-sheet"
          aria-label="Filtros"
          onClick={(event) => {
            if (event.target === mobileDialogRef.current) setMobileOpen(false);
          }}
        >
          <div className="filter-sheet-panel" tabIndex={-1}>
            <div className="filter-sheet-handle" aria-hidden="true" />
            <div className="filter-sheet-header">
              <h2>Filtros</h2>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setMobileOpen(false)}
                aria-label="Fechar filtros"
              >
                <X className="size-4" />
              </Button>
            </div>
            <div className="filter-sheet-body">
              {generatedFilters.map((filter) => (
                <label key={filter.key} className="filter-panel-field" data-filter-panel-key={filter.key}>
                  <span>{filter.label}</span>
                  {filter.control}
                </label>
              ))}
            </div>
            <div className="filter-sheet-footer">
              <Button type="button" variant="outline" onClick={clearAllFilters} disabled={!hasActiveFilters}>
                Limpar tudo
              </Button>
              <Button type="button" onClick={() => setMobileOpen(false)}>
                {applyLabel}
              </Button>
            </div>
          </div>
        </dialog>
      ) : null}
      <style>{filterStyles}</style>
    </>
  );
}

const filterStyles = `
.filter-card {
  position: relative;
  display: grid;
  gap: 8px;
  border-radius: 16px;
  border: 1px solid var(--border-subtle);
  background: var(--surface);
  padding: 8px;
  box-shadow: var(--shadow-xs);
}

.filter-row {
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: 8px;
}

.search-input {
  height: 44px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 650;
  padding: 0 14px 0 38px;
  outline: none;
  box-shadow: var(--shadow-xs);
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.search-input:hover {
  background: var(--surface);
  border-color: color-mix(in srgb, var(--primary) 45%, var(--color-border));
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-ring);
}

.filter-primary-slot {
  display: flex;
  align-items: center;
  gap: 8px;
}

.filter-primary-control {
  width: 168px;
  min-width: 140px;
}

.filter-toggle {
  position: relative;
  flex-shrink: 0;
}

.filter-toggle-mobile {
  display: none;
}

.filter-count-badge {
  position: absolute;
  top: -6px;
  right: -6px;
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--primary);
  color: var(--primary-foreground);
  padding: 0 5px;
  font-size: 0.6875rem;
  font-weight: 850;
  line-height: 1;
}

.select-input {
  height: 44px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 0.875rem;
  font-weight: 650;
  padding: 0 14px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371829D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
  box-shadow: var(--shadow-xs);
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
    box-shadow 150ms ease;
}

.select-input:hover {
  background: var(--surface);
  border-color: color-mix(in srgb, var(--primary) 45%, var(--color-border));
}

.select-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-ring);
}

.active-filter-row {
  display: flex;
  min-width: 0;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 8px;
}

.active-filter-chip {
  display: inline-flex;
  max-width: min(280px, 100%);
  height: 32px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: 999px;
  border: 1px solid color-mix(in srgb, var(--primary) 26%, var(--color-border));
  background: color-mix(in srgb, var(--primary) 9%, var(--surface));
  color: var(--text-primary);
  padding: 0 4px 0 10px;
  font-size: 0.75rem;
  font-weight: 750;
  line-height: 1;
  transition:
    background-color 150ms ease,
    border-color 150ms ease,
  color 150ms ease;
}

.active-filter-chip:hover,
.active-filter-chip:focus-within {
  border-color: var(--primary);
  color: var(--primary);
}

.active-filter-chip-label,
.active-filter-chip-remove,
.active-filter-clear {
  display: inline-flex;
  height: 100%;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: inherit;
  font: inherit;
  line-height: 1;
}

.active-filter-chip-label {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.active-filter-chip-remove {
  width: 26px;
  flex: 0 0 26px;
  border-radius: 999px;
}

.active-filter-chip-remove:hover {
  background: color-mix(in srgb, var(--primary) 12%, transparent);
}

.active-filter-clear {
  height: 32px;
  margin-left: auto;
  border-radius: 999px;
  padding: 0 10px;
  color: var(--primary);
  font-size: 0.75rem;
  font-weight: 800;
}

.active-filter-clear:hover {
  background: var(--primary-soft);
}

.active-filter-chip svg {
  width: 14px;
  height: 14px;
  flex-shrink: 0;
}

.filter-toggle-active {
  border-color: color-mix(in srgb, var(--primary) 48%, var(--color-border));
  color: var(--primary);
}

.filter-popover {
  position: absolute;
  top: calc(100% + 8px);
  right: 8px;
  z-index: 50;
  width: min(420px, calc(100vw - 32px));
  border-radius: 18px;
  border: 1px solid var(--border);
  background: var(--popover);
  padding: 12px;
  box-shadow: var(--shadow-elevated);
  color: var(--popover-foreground);
}

.filter-panel-grid {
  display: grid;
  gap: 12px;
}

.filter-panel-field {
  display: grid;
  gap: 6px;
  color: var(--text-secondary);
  font-size: 0.75rem;
  font-weight: 800;
}

.filter-panel-field > span {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.filter-panel-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 12px;
  border-top: 1px solid var(--border-subtle);
  padding-top: 12px;
}

.filter-sheet {
  width: 100%;
  max-width: none;
  max-height: min(88dvh, calc(100dvh - 12px));
  margin: auto auto 0;
  border: 0;
  background: transparent;
  color: var(--text-primary);
  padding: 0;
}

.filter-sheet::backdrop {
  background: rgba(3, 10, 24, 0.42);
  backdrop-filter: blur(8px);
}

.filter-sheet-panel {
  display: grid;
  max-height: min(88dvh, calc(100dvh - 12px));
  grid-template-rows: auto auto minmax(0, 1fr) auto;
  overflow: hidden;
  border-radius: 24px 24px 0 0;
  border: 1px solid var(--border);
  background: var(--popover);
  box-shadow: var(--shadow-elevated);
  color: var(--popover-foreground);
  outline: none;
}

.filter-sheet-handle {
  justify-self: center;
  width: 42px;
  height: 4px;
  margin-top: 10px;
  border-radius: 999px;
  background: var(--border);
}

.filter-sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--border-subtle);
  padding: 12px 16px;
}

.filter-sheet-header h2 {
  font-size: 1rem;
  font-weight: 900;
}

.filter-sheet-body {
  display: grid;
  gap: 12px;
  overflow-y: auto;
  padding: 16px;
}

.filter-sheet-footer {
  position: sticky;
  bottom: 0;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
  border-top: 1px solid var(--border-subtle);
  background: var(--surface);
  padding: 12px 16px calc(16px + env(safe-area-inset-bottom));
}

@media (max-width: 768px) {
  .search-input,
  .select-input {
    min-height: 44px;
    font-size: 16px;
  }

  .filter-card {
    gap: 8px;
    padding: 6px;
    position: sticky;
    top: 64px;
    z-index: 20;
  }

  .filter-row {
    gap: 8px;
  }

  .filter-primary-slot,
  .filter-toggle-desktop {
    display: none;
  }

  .filter-toggle-mobile {
    display: inline-flex;
  }

  .filter-toggle {
    min-height: 44px;
  }

  .active-filter-row {
    flex-wrap: nowrap;
    overflow-x: auto;
    border-top: 1px solid var(--border-subtle);
    padding: 8px 2px 2px;
    scrollbar-width: thin;
  }

  .active-filter-chip {
    max-width: 240px;
    flex: 0 0 auto;
    justify-content: flex-start;
  }

  .active-filter-clear {
    flex: 0 0 auto;
    margin-left: 0;
    border: 1px solid var(--border-subtle);
    background: var(--surface-2);
  }
}

@media (min-width: 769px) {
  .filter-card {
    min-height: 56px;
  }
}
`;

interface MonthSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function MonthSelect({ value, onValueChange }: MonthSelectProps) {
  const monthOptions = Array.from({ length: 12 }, (_, index) => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() - index);
    const optionValue = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    const label = date.toLocaleDateString("pt-BR", {
      month: "long",
      year: "numeric",
    });
    return {
      value: optionValue,
      label: label.charAt(0).toUpperCase() + label.slice(1),
    };
  });

  return (
    <select
      className="select-input"
      aria-label="Filtrar por mês"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="">Mês</option>
      {monthOptions.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

interface StatusSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function StatusSelect({ value, onValueChange }: StatusSelectProps) {
  return (
    <select
      className="select-input"
      aria-label="Filtrar por status"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
    >
      <option value="">Status</option>
      <option value="aberto">Aberto</option>
      <option value="pago">Pago</option>
      <option value="vencido">Vencido</option>
      <option value="cancelado">Cancelado</option>
      <option value="estornado">Estornado</option>
    </select>
  );
}

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  const resolvedAction =
    action ??
    (actionLabel && onAction ? (
      <Button onClick={onAction}>
        <Plus className="size-4" />
        {actionLabel}
      </Button>
    ) : undefined);
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {resolvedAction && (
        <div className="empty-state-action">{resolvedAction}</div>
      )}
    </div>
  );
}

interface PageShellProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function PageShell({
  title,
  subtitle,
  actionLabel,
  onAction,
  children,
}: PageShellProps) {
  const primaryAction =
    actionLabel && onAction ? (
      <Button type="button" size="lg" onClick={onAction} className="page-primary-action">
        <Plus className="size-4" />
        {actionLabel}
      </Button>
    ) : undefined;

  return (
    <div className="page-stack">
      <PageHeader
        title={title}
        description={subtitle}
        actions={primaryAction}
      />
      {children}
      {actionLabel && onAction ? (
        <div className="page-mobile-action">
          <FloatingActionButton
            icon={<Plus className="size-4" />}
            label={actionLabel}
            onClick={onAction}
          />
        </div>
      ) : null}
      <style>{pageHeaderStyles}</style>
      <style>{`${pageShellStyles}`}</style>
    </div>
  );
}

const pageShellStyles = `
.page-stack {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.page-mobile-action {
  display: none;
}

@media (max-width: 768px) {
  .page-stack {
    gap: 16px;
    padding-bottom: calc(var(--mobile-bottom-nav-offset, 88px) + 156px);
  }

  .page-primary-action {
    display: none;
  }

  .page-mobile-action {
    pointer-events: none;
    position: fixed;
    right: 16px;
    bottom: calc(var(--mobile-bottom-nav-offset, 88px) + 14px);
    z-index: 44;
    display: flex;
    justify-content: flex-end;
    max-width: calc(100vw - 32px);
  }

  .page-mobile-action > .mobile-fab {
    pointer-events: auto;
  }
}
`;

interface EmptyTableProps {
  columns: string[];
  emptyTitle: string;
  emptyDescription?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export function EmptyTable({
  columns: _columns,
  emptyTitle,
  emptyDescription,
  onAction,
  actionLabel,
}: EmptyTableProps) {
  return (
    <div className="table-card" style={{ padding: 0 }}>
      <EmptyState
        title={emptyTitle}
        description={emptyDescription}
        action={
          actionLabel && onAction ? (
            <Button onClick={onAction}>
              <Plus className="size-4" />
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}
