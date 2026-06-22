import { Banknote, CalendarDays, TrendingDown, TrendingUp } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell } from "@/components/layout/page-shell";

export function Component() {
  return (
    <PageShell icon={CalendarDays} title="Fluxo de Caixa" subtitle="Entradas, saídas e saldo previsto por período">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Entradas" value="R$ 0,00" icon={TrendingUp} tone="green" />
        <MetricCard title="Saídas" value="R$ 0,00" icon={TrendingDown} tone="red" />
        <MetricCard title="Saldo previsto" value="R$ 0,00" icon={Banknote} tone="blue" />
      </div>
      <FilterBar searchPlaceholder="Buscar movimentações..."><MonthSelect /></FilterBar>
      <EmptyTable columns={["Data", "Descrição", "Entrada", "Saída", "Saldo"]} emptyTitle="Selecione um período para visualizar o fluxo de caixa." />
    </PageShell>
  );
}
