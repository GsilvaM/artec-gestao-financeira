import { Network, Percent, WalletCards } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";
import { formatMoney } from "@/lib/utils";

export function Component() {
  return (
    <PageShell icon={Network} title="Relatório por centro de custo" subtitle="Rentabilidade e comparação de desempenho por unidade">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Centros analisados" value="0" icon={Network} tone="blue" />
        <MetricCard title="Margem média" value="0%" icon={Percent} tone="green" />
        <MetricCard title="Resultado" value={formatMoney(0)} icon={WalletCards} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar centro de custo..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Centro", "Receita", "Custo", "Margem", "Resultado", "Tendência"]} emptyTitle="Nenhum centro de custo com dados no período." emptyDescription="Cadastre lançamentos vinculados a centros de custo para preencher o relatório." />
    </PageShell>
  );
}
