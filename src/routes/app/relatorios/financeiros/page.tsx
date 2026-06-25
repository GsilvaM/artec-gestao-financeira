import { useMemo, useState } from "react";
import { AreaChart, ArrowDownCircle, ArrowUpCircle, Banknote, FileBarChart, Loader2 } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MonthSelect, PageShell, StatusSelect } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import { formatMoney } from "@/lib/utils";
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

  return (
    <PageShell icon={FileBarChart} title="Relatorio Financeiro" subtitle="Analise consolidada de receitas, despesas e saldo.">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard title="Receitas" value={formatMoney(receitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(despesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Saldo" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} />
        <MetricCard title="Indicadores" value={String(rows.length)} icon={AreaChart} tone="slate" />
      </div>

      <FilterBar searchPlaceholder="Buscar indicador financeiro..." search={search} onSearchChange={setSearch}>
        <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />
        <StatusSelect value={filterStatus} onValueChange={setFilterStatus} />
      </FilterBar>

      <FinancialReportTable rows={rows} isLoading={isLoading} hasError={Boolean(error)} periodLabel={periodLabel} />
    </PageShell>
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
  if (!filterMonth) return "Periodo atual";
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
            <TableHead>Periodo</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Realizado</TableHead>
            <TableHead>Meta</TableHead>
            <TableHead>Variacao</TableHead>
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
                  description={`Nao ha lancamentos para ${periodLabel.toLowerCase()} com os filtros atuais.`}
                />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
