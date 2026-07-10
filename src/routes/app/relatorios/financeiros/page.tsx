import { useMemo, useState } from "react";
import { AreaChart, ArrowDownCircle, ArrowUpCircle, Banknote, FileBarChart, Loader2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MonthSelect, PageShell, StatusSelect } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import { formatMoney, getMoneyToneClass } from "@/lib/utils";
import type { FinancialEntryFilters, FinancialEntryRow } from "@/domain/financeiro/types";

const STATUS_MAP: Record<string, FinancialEntryFilters["status"]> = {
  aberto: "pending",
  pago: "confirmed",
  vencido: "cancelled",
};

interface ReportRow {
  key: string;
  indicator: string;
  period: string;
  type: "receita" | "despesa" | "saldo";
  realized: number;
  goal: number;
  variation: number;
}

export function Component() {
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const filters = useMemo<FinancialEntryFilters | undefined>(() => {
    const current: FinancialEntryFilters = {};
    if (search) current.search = search;
    if (filterStatus && STATUS_MAP[filterStatus]) current.status = STATUS_MAP[filterStatus];
    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      current.dateFrom = new Date(Number(year), Number(month) - 1, 1);
      current.dateTo = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    }
    return Object.keys(current).length ? current : undefined;
  }, [filterMonth, filterStatus, search]);

  const { data: entries = [], isLoading, error } = useFinancialEntries(filters);
  const { receitas, despesas, saldo, rows, periodLabel } = useMemo(() => buildReport(entries, filterMonth), [entries, filterMonth]);
  const activeFilters = useMemo(
    () => [
      ...(search ? [{ key: "search", label: `Busca: ${search}`, onRemove: () => setSearch("") }] : []),
      ...(filterMonth ? [{ key: "month", label: `Mês: ${formatPeriod(filterMonth)}`, onRemove: () => setFilterMonth("") }] : []),
      ...(filterStatus ? [{ key: "status", label: `Status: ${filterStatus}`, onRemove: () => setFilterStatus("") }] : []),
    ],
    [filterMonth, filterStatus, search],
  );

  return (
    <PageShell icon={FileBarChart} title="Relatório financeiro" subtitle="Análise consolidada de receitas, despesas e saldo.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Receitas" value={formatMoney(receitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(despesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Saldo" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} valueClassName={getMoneyToneClass(saldo)} />
        <MetricCard title="Indicadores" value={String(rows.length)} icon={AreaChart} tone="slate" />
      </div>

      <FilterBar
        searchPlaceholder="Buscar indicador financeiro..."
        search={search}
        onSearchChange={setSearch}
        activeFilters={activeFilters}
        filters={[
          {
            key: "month",
            label: "Mês",
            control: <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />,
          },
          {
            key: "status",
            label: "Status",
            control: <StatusSelect value={filterStatus} onValueChange={setFilterStatus} />,
          },
        ]}
      />

      <div className="desktop-table">
        <FinancialReportTable rows={rows} isLoading={isLoading} hasError={Boolean(error)} periodLabel={periodLabel} />
      </div>
      <div className="mobile-list">
        <FinancialReportMobileList rows={rows} isLoading={isLoading} hasError={Boolean(error)} periodLabel={periodLabel} />
      </div>
    </PageShell>
  );
}

function FinancialReportMobileList({ rows, isLoading, hasError, periodLabel }: { rows: ReportRow[]; isLoading: boolean; hasError: boolean; periodLabel: string }) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div key={index} className="mobile-record-card">
            <div className="h-3 w-24 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-5 w-40 animate-pulse rounded-full bg-surface-muted" />
            <div className="h-px bg-border" />
            <div className="h-4 w-32 animate-pulse rounded-full bg-surface-muted" />
          </div>
        ))}
      </div>
    );
  }

  if (hasError) {
    return (
      <div className="mobile-record-card border-destructive/30 bg-danger-50 text-sm font-semibold text-destructive">
        Erro ao carregar dados financeiros.
      </div>
    );
  }

  if (!rows.length) {
    return (
      <EmptyState
        title="Nenhum dado financeiro encontrado."
        description={`NÃ£o hÃ¡ lanÃ§amentos para ${periodLabel.toLowerCase()} com os filtros atuais.`}
      />
    );
  }

  return (
    <div className="space-y-3">
      {rows.map((row) => {
        const toneClass = row.type === "receita" ? "text-success" : row.type === "despesa" ? "text-destructive" : "text-primary";
        return (
          <article key={row.key} className="mobile-record-card">
            <div className="flex min-w-0 items-start justify-between gap-3">
              <div className="min-w-0">
                <span className="mobile-record-label">{row.period}</span>
                <h3 className="mobile-record-title">{row.indicator}</h3>
              </div>
              <span className={toneClass}>
                {row.type === "receita" ? "Receita" : row.type === "despesa" ? "Despesa" : "Saldo"}
              </span>
            </div>
            <div className="mobile-record-values">
              <strong className={toneClass}>{formatMoney(row.realized)}</strong>
              <span>{row.goal ? `${row.variation.toFixed(1)}% da meta` : "Sem meta definida"}</span>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function buildReport(entries: FinancialEntryRow[], filterMonth: string) {
  const receitas = entries.filter((entry) => entry.type === "receita").reduce((sum, entry) => sum + entry.amount, 0);
  const despesas = entries.filter((entry) => entry.type === "despesa").reduce((sum, entry) => sum + entry.amount, 0);
  const saldo = receitas - despesas;
  const periodLabel = formatPeriod(filterMonth);

  const grouped = new Map<string, ReportRow>();
  for (const entry of entries) {
    const key = `${entry.type}:${entry.categoryName || "Sem categoria"}`;
    const current = grouped.get(key) ?? {
      key,
      indicator: entry.categoryName || "Sem categoria",
      period: periodLabel,
      type: entry.type,
      realized: 0,
      goal: 0,
      variation: 0,
    };
    current.realized += entry.amount;
    current.variation = current.goal ? ((current.realized - current.goal) / current.goal) * 100 : 0;
    grouped.set(key, current);
  }

  const rows = [...grouped.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type === "receita" ? -1 : 1;
    return b.realized - a.realized;
  });

  if (entries.length) {
    rows.push({
      key: "saldo:resultado",
      indicator: "Resultado do periodo",
      period: periodLabel,
      type: "saldo",
      realized: saldo,
      goal: 0,
      variation: 0,
    });
  }

  return { receitas, despesas, saldo, rows, periodLabel };
}

function formatPeriod(filterMonth: string) {
  if (!filterMonth) return "Período atual";
  const [year, month] = filterMonth.split("-");
  const date = new Date(Number(year), Number(month) - 1, 1);
  return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

function FinancialReportTable({ rows, isLoading, hasError, periodLabel }: { rows: ReportRow[]; isLoading: boolean; hasError: boolean; periodLabel: string }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Indicador</TableHead>
            <TableHead>Período</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Realizado</TableHead>
            <TableHead>Meta</TableHead>
            <TableHead>Variação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-56 text-center text-muted-foreground">
                <Loader2 className="mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : hasError ? (
            <TableRow>
              <TableCell colSpan={6} className="h-56 text-center text-sm font-medium text-destructive">
                Erro ao carregar dados financeiros.
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.key}>
                <TableCell className="font-medium">{row.indicator}</TableCell>
                <TableCell className="text-muted-foreground">{row.period}</TableCell>
                <TableCell>
                  <span className={row.type === "receita" ? "text-success" : row.type === "despesa" ? "text-destructive" : "text-primary"}>
                    {row.type === "receita" ? "Receita" : row.type === "despesa" ? "Despesa" : "Saldo"}
                  </span>
                </TableCell>
                <TableCell className="font-semibold tabular-nums">{formatMoney(row.realized)}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{row.goal ? formatMoney(row.goal) : "-"}</TableCell>
                <TableCell className="text-muted-foreground tabular-nums">{row.goal ? `${row.variation.toFixed(1)}%` : "-"}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={6} className="p-0">
                <EmptyState
                  title="Nenhum dado financeiro encontrado."
                  description={`Não há lançamentos para ${periodLabel.toLowerCase()} com os filtros atuais.`}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
