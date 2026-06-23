import { CircleDollarSign, Percent, TrendingUp } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { formatMoney } from "@/lib/utils";

export function Component() {
  return (
    <PageShell icon={TrendingUp} title="Rentabilidade" subtitle="Margem e resultado por centro de custo ou serviço">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receita operacional" value={formatMoney(0)} icon={CircleDollarSign} tone="green" />
        <MetricCard title="Margem média" value="0%" icon={Percent} tone="blue" />
        <MetricCard title="Resultado" value={formatMoney(0)} icon={TrendingUp} tone="blue" />
      </div>
      <FilterBar searchPlaceholder="Buscar centro de custo..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Centro de custo", "Receita", "Custo", "Margem", "Resultado"]} emptyTitle="Selecione um período para visualizar a rentabilidade por centro de custo." />
    </PageShell>
  );
}
