import type { LucideIcon } from "lucide-react";
import { ChevronDown, Loader2, Plus, Search, SlidersHorizontal, TableProperties } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface PageShellProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  children: ReactNode;
}

export function PageShell({ icon: Icon, title, subtitle, actionLabel, onAction, children }: PageShellProps) {
  return (
    <div className="mx-auto flex w-full max-w-[1560px] flex-col gap-6 px-4 pb-8 pt-6 sm:gap-7 sm:px-6 sm:pt-7 lg:px-10 lg:pt-9 2xl:px-12">
      <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="mt-1 flex size-11 shrink-0 items-center justify-center rounded-xl bg-accent text-primary ring-1 ring-primary/10">
            <Icon className="size-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-bold leading-tight text-foreground sm:text-4xl">{title}</h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base">{subtitle}</p>
          </div>
        </div>
        {actionLabel ? (
          <Button className="w-full sm:w-auto" onClick={onAction}>
            <Plus className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
      {children}
    </div>
  );
}

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
  return <span className={cn("font-semibold tabular-nums", color)}>{value}</span>;
}

const statusStyles: Record<string, string> = {
  aberto: "bg-primary/12 text-primary ring-primary/15",
  pending: "bg-warning/15 text-warning ring-warning/20",
  approved: "bg-success/12 text-success ring-success/20",
  rejected: "bg-destructive/12 text-destructive ring-destructive/20",
  disabled: "bg-muted text-muted-foreground ring-border",
  pago: "bg-success/12 text-success ring-success/20",
  confirmed: "bg-success/12 text-success ring-success/20",
  paid: "bg-success/12 text-success ring-success/20",
  received: "bg-success/12 text-success ring-success/20",
  vencido: "bg-destructive/12 text-destructive ring-destructive/20",
  overdue: "bg-destructive/12 text-destructive ring-destructive/20",
  cancelled: "bg-destructive/12 text-destructive ring-destructive/20",
  rascunho: "bg-warning/15 text-warning ring-warning/20",
  ativo: "bg-info/12 text-info ring-info/20",
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
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1", statusStyles[status] ?? "bg-slate-100 text-slate-700 ring-slate-500/10")}>
      {statusLabels[status] ?? status}
    </span>
  );
}

export function LoadingState({ label = "Carregando..." }: { label?: string }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="overflow-hidden">
          <CardContent className="space-y-4 p-5">
            <div className="h-3 w-24 animate-pulse rounded-full bg-muted" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-muted" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
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
  blue: "bg-primary-light text-primary",
  green: "bg-success-light text-success",
  red: "bg-destructive-light text-destructive",
  amber: "bg-warning-light text-warning",
  slate: "bg-muted text-muted-foreground",
};

export function MetricCard({ title, value, icon: Icon, tone = "blue", helper, className }: MetricCardProps) {
  return (
    <Card className={cn("min-w-0 transition duration-200 hover:-translate-y-0.5 hover:border-primary/20 hover:shadow-[var(--shadow-soft)]", className)}>
      <CardContent className="relative min-h-[9.75rem] p-5 sm:p-6">
        <div className="min-w-0">
          <p className="truncate pr-14 text-xs font-semibold uppercase text-muted-foreground">{title}</p>
          <p className="mt-4 max-w-full whitespace-nowrap text-2xl font-bold leading-tight text-foreground tabular-nums sm:text-[1.6rem]" title={value}>{value}</p>
          {helper ? <p className="mt-2 text-xs leading-5 text-muted-foreground">{helper}</p> : null}
        </div>
        <div className={cn("absolute right-5 top-5 flex size-12 items-center justify-center rounded-xl ring-1 ring-current/10 sm:right-6 sm:top-6", toneStyles[tone])}>
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
    <Card className="overflow-hidden">
      <CardContent className="p-3 sm:p-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input className="bg-background/50 pl-9" placeholder={searchPlaceholder} aria-label={searchPlaceholder} value={search} onChange={(e) => onSearchChange?.(e.target.value)} />
          </div>
          {hasFilters ? (
            <Button type="button" variant="outline" className="md:hidden" onClick={() => setOpen((current) => !current)} aria-expanded={open}>
              <SlidersHorizontal className="size-4" />
              Filtros
              <ChevronDown className={cn("ml-auto size-4 transition-transform duration-200 ease-in-out", open && "rotate-180")} />
            </Button>
          ) : null}
          {hasFilters ? (
            <div className={cn(
              "grid gap-3 transition-all duration-200 ease-in-out sm:grid-cols-2 md:flex md:shrink-0",
              open ? "max-h-96 opacity-100" : "max-h-0 overflow-hidden opacity-0 md:max-h-96 md:opacity-100",
            )}>
              {children}
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}

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
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex min-h-72 items-center justify-center px-4 py-10 text-center sm:px-6 sm:py-14">
      <div className="mx-auto flex w-full max-w-lg flex-col items-center">
        <div className="relative mb-5 flex size-16 items-center justify-center rounded-lg border border-border bg-card text-primary shadow-sm">
          <div className="absolute inset-2 rounded-md bg-primary/10" />
          <TableProperties className="relative size-7" />
        </div>
        <h3 className="text-balance text-base font-semibold leading-6 text-foreground sm:text-lg">{title}</h3>
        {description ? <p className="mt-2 max-w-md text-pretty text-sm leading-6 text-muted-foreground">{description}</p> : null}
        {actionLabel ? (
          <Button className="mt-6" variant="secondary" onClick={onAction}>
            <Plus className="size-4" />
            {actionLabel}
          </Button>
        ) : null}
      </div>
    </div>
  );
}

interface EmptyTableProps {
  columns: string[];
  emptyTitle: string;
  emptyDescription?: string;
}

export function EmptyTable({ columns, emptyTitle, emptyDescription }: EmptyTableProps) {
  return (
    <Card className="overflow-hidden">
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
              <EmptyState title={emptyTitle} description={emptyDescription} />
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  );
}

interface StarterPageProps {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
  metrics?: MetricCardProps[];
  columns: string[];
  emptyTitle: string;
  emptyDescription?: string;
  filters?: boolean;
}

export function StarterPage({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
  metrics = [],
  columns,
  emptyTitle,
  emptyDescription,
  filters = true,
}: StarterPageProps) {
  return (
    <PageShell icon={icon} title={title} subtitle={subtitle} actionLabel={actionLabel} onAction={onAction}>
      {metrics.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {metrics.map((metric) => (
            <MetricCard key={metric.title} {...metric} />
          ))}
        </div>
      ) : null}
      {filters ? (
        <FilterBar searchPlaceholder={`Buscar em ${title.toLowerCase()}...`}>
          <StatusSelect />
        </FilterBar>
      ) : null}
      <EmptyTable columns={columns} emptyTitle={emptyTitle} emptyDescription={emptyDescription} />
    </PageShell>
  );
}
