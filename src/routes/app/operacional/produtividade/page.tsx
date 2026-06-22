import { Gauge, Target, Timer } from "lucide-react";
import { EmptyTable, FilterBar, MetricCard, MonthSelect, PageShell, StatusSelect } from "@/components/layout/page-shell";

export function Component() {
  return (
    <PageShell icon={Gauge} title="Produtividade" subtitle="Métricas de execução por técnico e período">
      <div className="grid gap-4 sm:grid-cols-3">
        <MetricCard title="Serviços concluídos" value="0" icon={Target} tone="green" />
        <MetricCard title="Tempo médio" value="0h" icon={Timer} tone="blue" />
        <MetricCard title="Retrabalhos" value="0" icon={Gauge} tone="amber" />
      </div>
      <FilterBar searchPlaceholder="Buscar técnico..."><MonthSelect /><StatusSelect /></FilterBar>
      <EmptyTable columns={["Técnico", "Serviços", "Tempo médio", "Conclusão", "Retrabalho"]} emptyTitle="Selecione um período e técnico para visualizar a produtividade." />
    </PageShell>
  );
}
