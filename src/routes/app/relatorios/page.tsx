import { useNavigate } from "react-router";
import { BarChart3, FileBarChart, Landmark, Network, PieChart } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PageShell } from "@/components/layout/page-shell";

const reports = [
  { icon: Landmark, title: "Financeiros", description: "DRE, fluxo de caixa, contas e lançamentos", to: "/app/relatorios/financeiros" },
  { icon: FileBarChart, title: "Operacionais", description: "Serviços, técnicos, produtividade e execução", to: "/app/relatorios/operacionais" },
  { icon: Network, title: "Por centro de custo", description: "Rentabilidade, desempenho e comparativos", to: "/app/relatorios/centros-custo" },
];

export function Component() {
  const navigate = useNavigate();
  return (
    <PageShell icon={BarChart3} title="Relatórios" subtitle="Painéis e exportações para análise gerencial">
      <div className="grid gap-4 md:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.title} className="group overflow-hidden transition-colors hover:border-[#BBD7EF]">
            <CardHeader>
              <div className="mb-3 flex size-12 items-center justify-center rounded-lg bg-[#EAF3FB] text-[#174E8C]">
                <report.icon className="size-6" />
              </div>
              <CardTitle className="text-lg">{report.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm leading-6 text-[#64748B]">{report.description}</p>
              <Button variant="outline" className="w-full" onClick={() => navigate(report.to)}><PieChart className="size-4" /> Abrir Relatório</Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
