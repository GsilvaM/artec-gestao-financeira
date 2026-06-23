import { ArrowDownCircle, ArrowUpCircle, BarChart3, Scale } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { useDre } from "@/domain/financeiro/hooks/use-dre";
import { formatMoney, toFiniteNumber } from "@/lib/utils";

type DreResponse = {
  summary?: {
    totalReceitas?: number;
    totalDespesas?: number;
    resultado?: number;
  };
};

export function Component() {
  const { data } = useDre(new Date().getFullYear());
  const dre = data as DreResponse | undefined;
  const totalReceitas = toFiniteNumber(dre?.summary?.totalReceitas);
  const totalDespesas = toFiniteNumber(dre?.summary?.totalDespesas);
  const resultado = toFiniteNumber(dre?.summary?.resultado);

  return (
    <PageShell icon={BarChart3} title="DRE" subtitle="Demonstração de resultado por período">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receitas" value={formatMoney(totalReceitas)} icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value={formatMoney(totalDespesas)} icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Resultado" value={formatMoney(resultado)} icon={Scale} tone={resultado < 0 ? "red" : "blue"} />
      </div>
      <FilterBar searchPlaceholder="Buscar categoria ou centro de custo..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Grupo", "Categoria", "Realizado", "% Receita", "Variação"]} emptyTitle="Selecione um período para visualizar o DRE." />
    </PageShell>
  );
}
