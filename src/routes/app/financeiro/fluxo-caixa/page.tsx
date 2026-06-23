import { Banknote, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { useCashFlow } from "@/domain/financeiro/hooks/use-cash-flow";
import { formatMoney, toFiniteNumber } from "@/lib/utils";

type CashFlowRow = { receitas?: number; despesas?: number; saldo?: number };

export function Component() {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  const { data } = useCashFlow("month", start, end);
  const rows = (data as CashFlowRow[] | undefined) ?? [];
  const entradas = rows.reduce((sum, row) => sum + toFiniteNumber(row.receitas), 0);
  const saidas = rows.reduce((sum, row) => sum + toFiniteNumber(row.despesas), 0);
  const saldo = rows.reduce((sum, row) => sum + toFiniteNumber(row.saldo), 0);

  return (
    <PageShell icon={CalendarDays} title="Fluxo de Caixa" subtitle="Entradas, saídas e saldo previsto por período">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Entradas" value={formatMoney(entradas)} icon={TrendingUp} tone="green" />
        <MetricCard title="Saídas" value={formatMoney(saidas)} icon={TrendingDown} tone="red" />
        <MetricCard title="Saldo previsto" value={formatMoney(saldo)} icon={Banknote} tone={saldo < 0 ? "red" : "blue"} />
      </div>
      <FilterBar searchPlaceholder="Buscar movimentações..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Data", "Descrição", "Entrada", "Saída", "Saldo"]} emptyTitle="Selecione um período para visualizar o fluxo de caixa." />
    </PageShell>
  );
}
