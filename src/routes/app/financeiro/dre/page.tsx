import { ArrowDownCircle, ArrowUpCircle, BarChart3, Scale } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";

export function Component() {
  return (
    <PageShell icon={BarChart3} title="DRE" subtitle="Demonstração de resultado por período">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Receitas" value="R$ 0,00" icon={ArrowUpCircle} tone="green" />
        <MetricCard title="Despesas" value="R$ 0,00" icon={ArrowDownCircle} tone="red" />
        <MetricCard title="Resultado" value="R$ 0,00" icon={Scale} tone="blue" />
      </div>
      <FilterBar searchPlaceholder="Buscar categoria ou centro de custo..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Grupo", "Categoria", "Realizado", "% Receita", "Variação"]} emptyTitle="Selecione um período para visualizar o DRE." />
    </PageShell>
  );
}
