import { useMemo, useState } from "react";
import { ArrowDownCircle, ArrowUpCircle, BarChart3, Loader2, Scale } from "lucide-react";
import { EmptyState, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useFinancialEntries } from "@/domain/financeiro/hooks/use-financial-entries";
import { formatMoney } from "@/lib/utils";
import type { FinancialEntryFilters, FinancialEntryRow } from "@/domain/financeiro/types";

interface DreLine {
  id: string;
  group: string;
  category: string;
  type: "receita" | "despesa" | "resultado";
  amount: number;
  revenueShare: number;
  variation: number | null;
  emphasis?: boolean;
}

export function Component() {
  const [search, setSearch] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const filters = useMemo<FinancialEntryFilters | undefined>(() => {
    const current: FinancialEntryFilters = {};
    if (search) current.search = search;
    if (filterMonth) {
      const [year, month] = filterMonth.split("-");
      current.dateFrom = new Date(Number(year), Number(month) - 1, 1);
      current.dateTo = new Date(Number(year), Number(month), 0, 23, 59, 59, 999);
    }
    return Object.keys(current).length ? current : undefined;
  }, [filterMonth, search]);

  const { data: entries = [], isLoading, error } = useFinancialEntries(filters);
  const dre = useMemo(() => buildDre(entries), [entries]);

  return (
    <PageShell icon={BarChart3} title="DRE" subtitle="Demonstracao de resultado por periodo.">
      <div className="grid gap-3 sm:grid-cols-3">
        <MetricCard title="Receitas" value={formatMoney(dre.totalReceitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(dre.totalDespesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Resultado" value={formatMoney(dre.resultado)} icon={Scale} tone={dre.resultado < 0 ? "red" : "blue"} />
      </div>

      <FilterBar searchPlaceholder="Buscar categoria ou descricao..." search={search} onSearchChange={setSearch}>
        <MonthSelect value={filterMonth} onValueChange={setFilterMonth} />
      </FilterBar>

      <DreTable rows={dre.rows} isLoading={isLoading} hasError={Boolean(error)} />
    </PageShell>
  );
}

function buildDre(entries: FinancialEntryRow[]) {
  const totalReceitas = entries.filter((entry) => entry.type === "receita").reduce((sum, entry) => sum + entry.amount, 0);
  const totalDespesas = entries.filter((entry) => entry.type === "despesa").reduce((sum, entry) => sum + entry.amount, 0);
  const resultado = totalReceitas - totalDespesas;

  const categoryRows = new Map<string, DreLine>();
  for (const entry of entries) {
    const category = entry.categoryName || "Sem categoria";
    const group = entry.type === "receita" ? "Receitas operacionais" : "Despesas operacionais";
    const key = `${entry.type}:${category}`;
    const current = categoryRows.get(key) ?? {
      id: key,
      group,
      category,
      type: entry.type,
      amount: 0,
      revenueShare: 0,
      variation: null,
    };
    current.amount += entry.amount;
    categoryRows.set(key, current);
  }

  const rows = [...categoryRows.values()]
    .map((row) => ({
      ...row,
      revenueShare: totalReceitas ? (row.amount / totalReceitas) * 100 : 0,
    }))
    .sort((a, b) => {
      if (a.type !== b.type) return a.type === "receita" ? -1 : 1;
      return b.amount - a.amount;
    });

  if (entries.length) {
    rows.unshift({
      id: "total-receitas",
      group: "Receitas",
      category: "Receita bruta",
      type: "receita",
      amount: totalReceitas,
      revenueShare: totalReceitas ? 100 : 0,
      variation: null,
      emphasis: true,
    });
    rows.push({
      id: "total-despesas",
      group: "Despesas",
      category: "Total de despesas",
      type: "despesa",
      amount: totalDespesas,
      revenueShare: totalReceitas ? (totalDespesas / totalReceitas) * 100 : 0,
      variation: null,
      emphasis: true,
    });
    rows.push({
      id: "resultado-liquido",
      group: "Resultado",
      category: "Resultado liquido",
      type: "resultado",
      amount: resultado,
      revenueShare: totalReceitas ? (resultado / totalReceitas) * 100 : 0,
      variation: null,
      emphasis: true,
    });
  }

  return { totalReceitas, totalDespesas, resultado, rows };
}

function DreTable({ rows, isLoading, hasError }: { rows: DreLine[]; isLoading: boolean; hasError: boolean }) {
  return (
    <Card className="overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Grupo</TableHead>
            <TableHead>Categoria</TableHead>
            <TableHead>Realizado</TableHead>
            <TableHead>% Receita</TableHead>
            <TableHead>Variacao</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading ? (
            <TableRow>
              <TableCell colSpan={5} className="h-56 text-center text-muted-foreground">
                <Loader2 className="mx-auto size-5 animate-spin" />
              </TableCell>
            </TableRow>
          ) : hasError ? (
            <TableRow>
              <TableCell colSpan={5} className="h-56 text-center text-sm font-medium text-destructive">
                Erro ao carregar DRE.
              </TableCell>
            </TableRow>
          ) : rows.length ? (
            rows.map((row) => (
              <TableRow key={row.id} className={row.emphasis ? "bg-muted/45 font-semibold" : undefined}>
                <TableCell className="text-muted-foreground">{row.group}</TableCell>
                <TableCell className="font-medium">{row.category}</TableCell>
                <TableCell className={row.type === "receita" ? "text-success" : row.type === "despesa" ? "text-destructive" : row.amount < 0 ? "text-destructive" : "text-primary"}>
                  {formatMoney(row.amount)}
                </TableCell>
                <TableCell className="tabular-nums text-muted-foreground">{row.revenueShare.toFixed(1)}%</TableCell>
                <TableCell className="text-muted-foreground">{row.variation === null ? "-" : `${row.variation.toFixed(1)}%`}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={5} className="p-0">
                <EmptyState title="Nenhum lancamento encontrado." description="Cadastre receitas e despesas para visualizar a DRE." />
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Card>
  );
}
