import { AreaChart, Banknote, FileBarChart, TrendingUp } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell, StatusSelect } from "@/components/layout/page-shell";
import { formatMoney } from "@/lib/utils";

export function Component() {
  return (
    <PageShell icon={FileBarChart} title="Relatório Financeiro" subtitle="Análise consolidada de receitas, despesas e saldo">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receitas" value={formatMoney(0)} icon={TrendingUp} tone="green" />
        <MetricCard title="Saldo" value={formatMoney(0)} icon={Banknote} tone="blue" />
        <MetricCard title="Indicadores" value="0" icon={AreaChart} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar indicador financeiro..."><MonthSelect /><StatusSelect /></FilterBar>
      <EmptyTable columns={["Indicador", "Período", "Realizado", "Meta", "Variação"]} emptyTitle="Nenhum dado financeiro encontrado para o período." emptyDescription="Os dados aparecerão aqui quando houver lançamentos integrados." />
    </PageShell>
  );
}
