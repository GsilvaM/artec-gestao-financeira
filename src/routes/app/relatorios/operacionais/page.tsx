import { ClipboardList, Gauge, Timer, Users } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell, StatusSelect } from "@/components/layout/page-shell";

export function Component() {
  return (
    <PageShell icon={Gauge} title="Relatório Operacional" subtitle="Produtividade, serviços e desempenho das equipes">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Serviços" value="0" icon={ClipboardList} tone="blue" />
        <MetricCard title="Tempo médio" value="0h" icon={Timer} tone="amber" />
        <MetricCard title="Equipe" value="0" icon={Users} tone="slate" />
      </div>
      <FilterBar searchPlaceholder="Buscar técnico, serviço ou cliente..."><MonthSelect /><StatusSelect /></FilterBar>
      <EmptyTable columns={["Serviço", "Técnico", "Cliente", "Status", "Prazo", "Resultado"]} emptyTitle="Nenhum dado operacional encontrado." emptyDescription="Os indicadores serão exibidos quando houver serviços cadastrados." />
    </PageShell>
  );
}
