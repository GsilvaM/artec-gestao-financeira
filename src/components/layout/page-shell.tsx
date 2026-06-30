import type { LucideIcon } from "lucide-react";
import { ChevronDown, Loader2, Plus, Search, SlidersHorizontal } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
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
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 26px;
}

.page-header-title {
  margin: 0;
  font-size: clamp(28px, 2.2vw, 36px);
  line-height: 1.2;
  font-weight: 900;
  letter-spacing: -0.035em;
  color: var(--color-text-primary);
}

.page-header-desc {
  margin: 8px 0 0;
  font-size: 15px;
  line-height: 1.55;
  color: var(--color-text-secondary);
}

.page-header-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

@media (max-width: 767px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
  }
  .page-header-actions {
    width: 100%;
    flex-wrap: wrap;
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

export function MoneyValue({ value, tone = "neutral" }: { value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-success" : tone === "negative" ? "text-destructive" : "text-foreground";
  return <span className={cn("font-bold tabular-nums", color)}>{value}</span>;
}

const statusStyles: Record<string, string> = {
  aberto: "bg-primary-soft text-primary",
  pending: "bg-warning-soft text-warning-strong",
  approved: "bg-success-soft text-success-strong",
  rejected: "bg-danger-soft text-danger-strong",
  disabled: "bg-surface-soft text-text-secondary",
  pago: "bg-success-soft text-success-strong",
  confirmed: "bg-success-soft text-success-strong",
  paid: "bg-success-soft text-success-strong",
  received: "bg-success-soft text-success-strong",
  vencido: "bg-danger-soft text-danger-strong",
  overdue: "bg-danger-soft text-danger-strong",
  cancelled: "bg-surface-soft text-text-muted",
  rascunho: "bg-warning-soft text-warning-strong",
  ativo: "bg-primary-soft text-primary",
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold", statusStyles[status] ?? "bg-surface-soft text-text-secondary")}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="space-y-4 p-6">
            <div className="h-3 w-24 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-8 w-36 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-3 w-44 animate-pulse rounded-full bg-surface-muted" />
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <Loader2 className="size-3 animate-spin" />
              {label}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

const toneStyles = {
  blue: "bg-primary-soft text-primary",
  green: "bg-success-soft text-success",
  red: "bg-danger-soft text-danger",
  amber: "bg-warning-soft text-warning",
  slate: "bg-surface-soft text-text-secondary",
};

export function MetricCard({ title, value, icon: Icon, tone = "blue", helper, className }: MetricCardProps) {
  return (
    <Card className={cn("card-hover min-w-0", className)}>
      <CardContent className="relative min-h-[166px] p-6">
        <div className="min-w-0">
          <p className="truncate pr-14 text-[11px] font-black uppercase tracking-[0.08em] text-text-muted">{title}</p>
          <p className="mt-4 text-2xl font-black tracking-[-0.035em] text-text-primary tabular-nums sm:text-[1.65rem]" title={value}>{value}</p>
          {helper ? <p className="mt-3 text-sm font-semibold text-text-secondary">{helper}</p> : null}
        </div>
        <div className={cn("absolute right-5 top-5 flex size-12 items-center justify-center rounded-2xl border sm:right-6 sm:top-6", toneStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterBarProps {
  searchPlaceholder?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
  children?: ReactNode;
}

export function FilterBar({ searchPlaceholder = "Buscar...", search, onSearchChange, children }: FilterBarProps) {
  const [open, setOpen] = useState(true);
  const hasFilters = Boolean(children);

  return (
    <>
      <div className="filter-bar">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-muted" />
          <Input className="pl-9" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={search} onChange={(e) => onSearchChange?.(e.target.value)} />
        </div>
        {hasFilters && (
          <>
            <Button type="button" variant="outline" className="md:hidden" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
              <SlidersHorizontal className="size-4" />
              Filtros
              <ChevronDown className={cn("ml-auto size-4 transition-transform", open && "rotate-180")} />
            </Button>
            <div className={cn("hidden md:flex gap-3", open ? "flex flex-wrap" : "hidden")}>
              {children}
            </div>
          </>
        )}
      </div>
      <style>{filterBarStyles}</style>
    </>
  );
}

const filterBarStyles = `
.filter-bar {
  padding: 14px;
  border-radius: 18px;
  border: 1px solid var(--color-border);
  background: var(--color-surface);
  box-shadow: var(--shadow-card);
  display: flex;
  align-items: center;
  gap: 12px;
}

.filter-bar input { flex: 1; }

@media (max-width: 1023px) {
  .filter-bar { flex-direction: column; align-items: stretch; }
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
    const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
    return { value: optionValue, label: label.charAt(0).toUpperCase() + label.slice(1) };
  });

  return (
    <Select
      className="md:w-44"
      aria-label="Filtrar por mês"
      placeholder="Mês"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      options={monthOptions}
    />
  );
}

interface StatusSelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
}

export function StatusSelect({ value, onValueChange }: StatusSelectProps) {
  return (
    <Select
      className="md:w-44"
      aria-label="Filtrar por status"
      placeholder="Status"
      value={value ?? ""}
      onChange={(e) => onValueChange?.(e.target.value)}
      options={[
        { value: "aberto", label: "Aberto" },
        { value: "pago", label: "Pago" },
        { value: "vencido", label: "Vencido" },
      ]}
    />
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

export function EmptyState({ icon, title, description, action, actionLabel, onAction }: EmptyStateProps) {
  const resolvedAction = action ?? (actionLabel && onAction ? <Button onClick={onAction}><Plus className="size-4" />{actionLabel}</Button> : undefined);
  return (
    <div className="empty-state">
      {icon && <div className="empty-state-icon">{icon}</div>}
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {resolvedAction && <div className="empty-state-action">{resolvedAction}</div>}
    </div>
  );
}

export const emptyStateStyles = `
.empty-state {
  min-height: 240px;
  margin: 16px;
  padding: 42px 24px;
  text-align: center;
  display: grid;
  place-items: center;
  border: 1px dashed var(--color-border-strong);
  border-radius: 22px;
  background: color-mix(in srgb, var(--color-surface) 72%, transparent);
}

.empty-state-icon {
  width: 68px;
  height: 68px;
  border-radius: 22px;
  display: grid;
  place-items: center;
  background: var(--color-primary-soft);
  color: var(--color-primary);
  margin-bottom: 16px;
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--primary) 12%, transparent);
}

.empty-state h3 {
  margin: 0;
  font-size: 17px;
  font-weight: 900;
  color: var(--color-text-primary);
}

.empty-state p {
  max-width: 420px;
  margin: 8px 0 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.65;
}

.empty-state-action {
  margin-top: 20px;
}
`;

interface PageShellProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function PageShell({ title, subtitle, actionLabel, onAction, children }: PageShellProps) {
  return (
    <div className="page-stack">
      <PageHeader
        title={title}
        description={subtitle}
        actions={actionLabel && onAction ? <Button onClick={onAction}><Plus className="size-4" />{actionLabel}</Button> : undefined}
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

export function EmptyTable({ columns, emptyTitle, emptyDescription, onAction, actionLabel }: EmptyTableProps) {
  return (
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((column) => (
              <TableHead key={column}>{column}</TableHead>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell colSpan={columns.length} className="p-0">
              <EmptyState
                title={emptyTitle}
                description={emptyDescription}
                action={actionLabel && onAction ? <Button onClick={onAction}><Plus className="size-4" />{actionLabel}</Button> : undefined}
              />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}
