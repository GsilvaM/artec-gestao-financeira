import type { LucideIcon } from "lucide-react";
import { Loader2, Plus, Search, TableProperties } from "lucide-react";
import type { ReactNode } from "react";
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
    <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-8 pt-6 sm:px-6 lg:px-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex size-12 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#174E8C]">
            <Icon className="size-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-[#0F172A]">{title}</h1>
            <p className="mt-1 text-sm text-[#64748B]">{subtitle}</p>
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
}

export function MoneyValue({ value, tone = "neutral" }: { value: string; tone?: "neutral" | "positive" | "negative" }) {
  const color = tone === "positive" ? "text-[#10B981]" : tone === "negative" ? "text-[#EF4444]" : "text-[#0F172A]";
  return <span className={cn("font-semibold tabular-nums", color)}>{value}</span>;
}

const statusStyles: Record<string, string> = {
  aberto: "bg-[#EAF3FB] text-[#174E8C] ring-[#2F73B8]/15",
  pending: "bg-[#EAF3FB] text-[#174E8C] ring-[#2F73B8]/15",
  pago: "bg-emerald-50 text-[#10B981] ring-emerald-500/15",
  confirmed: "bg-emerald-50 text-[#10B981] ring-emerald-500/15",
  vencido: "bg-red-50 text-[#EF4444] ring-red-500/15",
  cancelled: "bg-red-50 text-[#EF4444] ring-red-500/15",
  rascunho: "bg-amber-50 text-[#F59E0B] ring-amber-500/15",
  ativo: "bg-slate-100 text-slate-700 ring-slate-500/10",
};

const statusLabels: Record<string, string> = {
  aberto: "Aberto",
  pending: "Pendente",
  pago: "Pago",
  confirmed: "Confirmado",
  vencido: "Vencido",
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
            <div className="h-3 w-24 animate-pulse rounded-full bg-slate-100" />
            <div className="h-8 w-32 animate-pulse rounded-full bg-slate-100" />
            <div className="flex items-center gap-2 text-xs text-[#94A3B8]">
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
  blue: "bg-[#EAF3FB] text-[#174E8C]",
  green: "bg-emerald-50 text-[#10B981]",
  red: "bg-red-50 text-[#EF4444]",
  amber: "bg-amber-50 text-[#F59E0B]",
  slate: "bg-slate-100 text-slate-600",
};

export function MetricCard({ title, value, icon: Icon, tone = "blue", helper }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-sm font-medium text-[#64748B]">{title}</p>
          <p className="mt-2 text-2xl font-bold text-[#0F172A]">{value}</p>
          {helper ? <p className="mt-1 text-xs text-[#94A3B8]">{helper}</p> : null}
        </div>
        <div className={cn("flex size-11 items-center justify-center rounded-2xl", toneStyles[tone])}>
          <Icon className="size-5" />
        </div>
      </CardContent>
    </Card>
  );
}

interface FilterBarProps {
  searchPlaceholder?: string;
  children?: ReactNode;
}

export function FilterBar({ searchPlaceholder = "Buscar...", children }: FilterBarProps) {
  return (
    <Card>
      <CardContent className="flex flex-col gap-3 p-4 md:flex-row md:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#94A3B8]" />
          <Input className="pl-9" placeholder={searchPlaceholder} />
        </div>
        {children}
      </CardContent>
    </Card>
  );
}

export function MonthSelect() {
  return (
    <Select
      className="md:w-44"
      placeholder="Mês"
      options={[
        { value: "2026-06", label: "Junho/2026" },
        { value: "2026-05", label: "Maio/2026" },
        { value: "2026-04", label: "Abril/2026" },
      ]}
    />
  );
}

export function StatusSelect() {
  return (
    <Select
      className="md:w-44"
      placeholder="Status"
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
    <div className="flex flex-col items-center justify-center px-4 py-12 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-[#EAF3FB] text-[#174E8C]">
        <TableProperties className="size-6" />
      </div>
      <h3 className="mt-4 text-base font-semibold text-[#0F172A]">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm text-[#64748B]">{description}</p> : null}
      {actionLabel ? (
        <Button className="mt-5" variant="secondary" onClick={onAction}>
          <Plus className="size-4" />
          {actionLabel}
        </Button>
      ) : null}
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
