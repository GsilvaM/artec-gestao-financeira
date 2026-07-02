import { useMemo, useState } from "react";
import { Banknote, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { cn, formatMoney, toFiniteNumber } from "@/lib/utils";

type CashFlowRow = { period?: string; receitas?: number; despesas?: number; saldo?: number };

export function Component() {
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [start, end] = useMemo(() => {
    const fallback = new Date();
    const fallbackMonth = `${fallback.getFullYear()}-${String(fallback.getMonth() + 1).padStart(2, "0")}`;
    const [year, month] = (filterMonth || fallbackMonth).split("-");
    return [
      new Date(Number(year), Number(month) - 1, 1),
      new Date(Number(year), Number(month), 0, 23, 59, 59, 999),
    ];
  }, [filterMonth]);
  const { data, isLoading, error } = useCashFlow("month", start, end);
  const rows = (data as CashFlowRow[] | undefined) ?? [];
  const entradas = rows.reduce((sum, row) => sum + toFiniteNumber(row.receitas), 0);
  const saidas = rows.reduce((sum, row) => sum + toFiniteNumber(row.despesas), 0);
  const saldo = rows.reduce((sum, row) => sum + toFiniteNumber(row.saldo), 0);

  return (
    <PageShell icon={CalendarDays} title="Fluxo de caixa" subtitle="Entradas, saidas e saldo previsto por periodo">
      <div className="stats-grid">
        <MetricCard title="Entradas" value={formatMoney(entradas)} icon={TrendingUp} tone="green" />
        <MetricCard title="Saidas" value={formatMoney(saidas)} icon={TrendingDown} tone="red" />
        <MetricCard title="Saldo previsto" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} />
      </div>

      <FilterBar
        activeFilters={
          filterMonth
            ? [{ key: "month", label: formatMonthFilter(filterMonth), onRemove: () => setFilterMonth("") }]
            : []
        }
      >
        <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />
      </FilterBar>

      <div className="desktop-table">
        <CashFlowTable rows={rows} isLoading={isLoading} hasError={Boolean(error)} />
      </div>

      <div className="mobile-list">
        <CashFlowMobileList rows={rows} isLoading={isLoading} hasError={Boolean(error)} />
      </div>
    </PageShell>
  );
}

function CashFlowTable({ rows, isLoading, hasError }: { rows: CashFlowRow[]; isLoading: boolean; hasError: boolean }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Periodo</TableHead>
            <TableHead>Entrada</TableHead>
            <TableHead>Saida</TableHead>
            <TableHead>Saldo</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow><TableCell colSpan={4} className="h-48 text-center text-sm text-muted-foreground">Carregando...</TableCell></TableRow>
          ) : hasError ? (
            <TableRow><TableCell colSpan={4} className="h-48 text-center text-sm font-medium text-destructive">Erro ao carregar fluxo de caixa.</TableCell></TableRow>
          ) : rows.length ? rows.map((row) => {
            const saldo = toFiniteNumber(row.saldo);
            return (
              <TableRow key={row.period}>
                <TableCell className="font-medium">{formatPeriod(row.period)}</TableCell>
                <TableCell className="font-semibold tabular-nums text-success">{formatMoney(row.receitas ?? 0)}</TableCell>
                <TableCell className="font-semibold tabular-nums text-destructive">{formatMoney(row.despesas ?? 0)}</TableCell>
                <TableCell className="font-semibold tabular-nums">{formatMoney(saldo)}</TableCell>
              </TableRow>
            );
          }) : (
            <TableRow>
              <TableCell colSpan={4} className="p-0">
                <EmptyState title="Nenhum fluxo de caixa encontrado." description="Nao ha movimentacoes financeiras no periodo selecionado." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}

function CashFlowMobileList({ rows, isLoading, hasError }: { rows: CashFlowRow[]; isLoading: boolean; hasError: boolean }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="cashflow-card">
            <div className="h-3 w-32 animate-pulse rounded-full bg-surface-muted" />
            <div className="mt-3 space-y-2">
              <div className="h-4 w-full animate-pulse rounded-full bg-surface-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-surface-muted" />
              <div className="h-4 w-full animate-pulse rounded-full bg-surface-muted" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="rounded-2xl border border-dashed border-destructive/30 bg-danger-50 p-8 text-center text-sm font-medium text-destructive">
        Erro ao carregar fluxo de caixa.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState title="Nenhum fluxo de caixa encontrado." description="Nao ha movimentacoes financeiras no periodo selecionado." />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const saldo = toFiniteNumber(row.saldo);
        return (
          <article key={row.period} className="cashflow-card">
            <header>
              <span>Período</span>
              <strong>{formatPeriod(row.period)}</strong>
            </header>
            <div className="cashflow-values">
              <div>
                <span>Entrada</span>
                <strong className="money money-income">{formatMoney(row.receitas ?? 0)}</strong>
              </div>
              <div>
                <span>Saída</span>
                <strong className="money money-expense">{formatMoney(row.despesas ?? 0)}</strong>
              </div>
              <div>
                <span>Saldo</span>
                <strong className={cn("money", saldo < 0 ? "money-expense" : "money-balance")}>{formatMoney(saldo)}</strong>
              </div>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function formatPeriod(period?: string) {
  if (!period) return "-";
  const date = new Date(period);
  if (Number.isNaN(date.getTime())) return period;
  const label = date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}

function formatMonthFilter(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  if (!year || !monthIndex) return month;
  const label = new Date(year, monthIndex - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  return label.charAt(0).toUpperCase() + label.slice(1);
}
