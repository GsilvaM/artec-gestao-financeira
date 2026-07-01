import type { LucideIcon } from "lucide-react";
import {
  ChevronDown,
  Loader2,
  Plus,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
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
}: MetricCardProps) {
  return (
    <div className={cn("stat-card", className)}>
      <div className="stat-card-header">
        <span className="stat-label">{title}</span>
        <span className={cn("stat-icon-wrap", toneStyles[tone])}>
          <Icon size={18} />
        </span>
      </div>
      <strong className="stat-value">{value}</strong>
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
            <div className="bg-surface-muted h-3 w-24 animate-pulse rounded-full" />
            <div className="bg-surface-muted h-8 w-36 animate-pulse rounded-full" />
            <div className="bg-surface-muted h-3 w-44 animate-pulse rounded-full" />
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
  children?: ReactNode;
}

export function FilterBar({
  searchPlaceholder = "Buscar...",
  search,
  onSearchChange,
  children,
}: FilterBarProps) {
  const [open, setOpen] = useState(true);
  const hasFilters = Boolean(children);

  return (
    <>
      <div className="filter-card">
        <div className="filter-row">
          <div className="relative min-w-0 flex-1">
            <Search className="text-text-muted absolute top-1/2 left-3 size-4 -translate-y-1/2" />
            <input
              className="search-input"
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              value={search}
              onChange={(e) => onSearchChange?.(e.target.value)}
            />
          </div>
          {hasFilters && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="filter-toggle"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
            >
              <SlidersHorizontal size={16} />
              Filtros
              <ChevronDown
                size={14}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </Button>
          )}
        </div>
        {hasFilters && open && <div className="filter-content">{children}</div>}
      </div>
      <style>{filterStyles}</style>
    </>
  );
}

const filterStyles = `
.search-input {
  height: 44px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 0.875rem;
  padding: 0 14px 0 38px;
  outline: none;
}

.search-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-ring);
}

.select-input {
  height: 44px;
  width: 100%;
  border-radius: 12px;
  border: 1px solid var(--color-border);
  background: var(--surface-2);
  color: var(--text-primary);
  font-size: 0.875rem;
  padding: 0 14px;
  outline: none;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2371829D' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 12px center;
  padding-right: 36px;
}

.select-input:focus {
  border-color: var(--primary);
  box-shadow: 0 0 0 2px var(--primary-ring);
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
  return (
    <div className="page-stack">
      <PageHeader
        title={title}
        description={subtitle}
        actions={
          actionLabel && onAction ? (
            <Button type="button" size="lg" onClick={onAction}>
              <Plus className="size-4" />
              {actionLabel}
            </Button>
          ) : undefined
        }
      />
      {children}
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
